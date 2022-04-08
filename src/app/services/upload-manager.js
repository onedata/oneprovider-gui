/**
 * Manages uploading files using resumable.js and external state of upload
 * received from Onezone.
 *
 * @module services/upload-manager
 * @author Michał Borzęcki
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { computed, observer, get, getProperties } from '@ember/object';
import { reads } from '@ember/object/computed';
import Resumable from 'npm:resumablejs';
import { Promise, resolve } from 'rsvp';
import getGuiAuthToken from 'onedata-gui-websocket-client/utils/get-gui-auth-token';
import PromiseObject from 'onedata-gui-common/utils/ember/promise-object';
import moment from 'moment';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { later, throttle } from '@ember/runloop';
import { v4 as uuid } from 'ember-uuid';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import _ from 'lodash';
import createThrottledFunction from 'onedata-gui-common/utils/create-throttled-function';

export default Service.extend(I18n, {
  appProxy: service(),
  fileManager: service(),
  onedataRpc: service(),
  errorExtractor: service(),
  i18n: service(),
  guiContext: service(),

  /**
   * @override
   */
  i18nPrefix: 'services.uploadManager',

  /**
   * @type {PromiseObject<string>}
   */
  tokenProxy: undefined,

  /**
   * @type {number}
   */
  tokenRegenerateTimestamp: 0,

  /**
   * Space where files should be uploaded
   * @type {Models.Space}
   */
  targetSpace: undefined,

  /**
   * Id of directory where files should be uploaded
   * @type {Models.File}
   */
  targetDirectory: undefined,

  /**
   * @type {HTMLElement}
   */
  browseElement: undefined,

  /**
   * @type {HTMLElement}
   */
  dropElement: undefined,

  /**
   * Mapping space -> Resumable
   */
  resumablePerSpaceMap: computed(() => new Map()),

  /**
   * @type {Ember.ComputedProperty<Object>}
   */
  injectedUploadState: reads('appProxy.injectedData.uploadFiles'),

  /**
   * @type {ComputedProperty<Object>} keys: dir ids (string), values: throttled functions
   */
  throttledRefresh: computed(() => ({})),

  /**
   * @type {ComputedProperty<Object>} keys: unique file-per-upload id (string),
   *   values: throttled functions
   */
  throttledUploadProgress: computed(() => ({})),

  /**
   * @type {Ember.ComputedProperty<Resumable>}
   */
  resumable: computed('targetSpace', function resumable() {
    return this.getResumable();
  }),

  _refreshDirectoryChildrenFun: computed(function _refreshDirectoryChildrenFun() {
    const fileManager = this.get('fileManager');
    return function _refreshDirectoryChildren(dirId) {
      return fileManager.dirChildrenRefresh(dirId);
    };
  }),

  injectedUploadStateObserver: observer(
    'injectedUploadState',
    function injectedUploadStateObserver() {
      const {
        injectedUploadState,
        resumablePerSpaceMap,
      } = this.getProperties('injectedUploadState', 'resumablePerSpaceMap');

      if (injectedUploadState) {
        // cancel all uploads, that are not present in injected list
        const injectedPathsPerUploadId = new Map();
        const resumableFiles =
          _.flatten([...resumablePerSpaceMap.values()].mapBy('files'));
        resumableFiles
          .reject(resumableFile => {
            const {
              uploadId,
              relativePath,
            } = getProperties(resumableFile, 'uploadId', 'relativePath');
            if (!injectedPathsPerUploadId.has(uploadId)) {
              const upload = injectedUploadState[uploadId] || {};
              const uploadFilesPaths = (upload.files || []).mapBy('path');
              injectedPathsPerUploadId.set(uploadId, new Set(uploadFilesPaths));
            }
            return injectedPathsPerUploadId.get(uploadId).has(relativePath);
          })
          .forEach(resumableFile => {
            resumableFile.isCancelled = true;
            resumableFile.cancel();
            // Make cleanup after 1s delay to let xhr connections abort
            // (it is not always an immediate process). Unfortunately `abort()`
            // method of xhr object (used in Resumable) does not return any
            // information when connection is REALLY closed.
            later(
              this,
              () => this.deleteFailedFile(resumableFile)
              .finally(() => this.finalizeFileUpload(resumableFile)),
              1000
            );
          });
      }
    }
  ),

  init() {
    this._super(...arguments);

    this.injectedUploadStateObserver();
  },

  getResumable() {
    const {
      targetSpace,
      resumablePerSpaceMap,
    } = this.getProperties('targetSpace', 'resumablePerSpaceMap');

    if (!resumablePerSpaceMap.has(targetSpace)) {
      const oneproviderApiOrigin = this.get('guiContext.apiOrigin');
      const chunkSize =
        get(targetSpace || {}, 'preferableWriteBlockSize') || 1 * 1024 * 1024;
      const resumable = new Resumable({
        target: `https://${oneproviderApiOrigin}/file_upload`,
        chunkSize,
        simultaneousUploads: 4,
        testChunks: false,
        minFileSize: 0,
        throttleProgressCallbacks: 1,
        permanentErrors: [400, 404, 405, 415, 500, 501],
        identifierParameterName: null,
        maxChunkRetries: 5,
        preprocess: (fileChunk) => {
          const resumableFile = fileChunk.fileObj;

          if (!resumableFile.initializeUploadPromise) {
            resumableFile.initializeUploadPromise =
              this.createCorrespondingFile(resumableFile)
              .then(() => this.initializeFileUpload(resumableFile))
              .then(() => this.notifyUploadInitialized(resumableFile));
          }

          Promise.all([
              resumableFile.initializeUploadPromise,
              this.getAuthToken(),
            ])
            .then(() => fileChunk.preprocessFinished())
            .catch(error => {
              // Error occurred in chunk preprocessing so either cannot create
              // directory/file or cannot get auth token. In both cases the whole
              // file upload must be cancelled.
              resumableFile.cancel();
              // BUGFIX: Resumable does not replace cancelled not-started chunk
              // with a new one in upload queue. We need to invoke `uploadNextChunk`
              // manually.
              fileChunk.resumableObj.uploadNextChunk();

              const errorMessage = get(
                this.get('errorExtractor').getMessage(error),
                'message.string'
              ) || this.t('unknownError');
              this.notifyParent({
                uploadId: resumableFile.uploadId,
                path: resumableFile.relativePath,
                error: errorMessage,
              });

              this.deleteFailedFile(resumableFile)
                .finally(() => this.finalizeFileUpload(resumableFile));
            });
        },
        headers: () => {
          return { 'X-Auth-Token': this.get('tokenProxy.content') };
        },
        query(file) {
          return { guid: get(file.fileModel, 'entityId') };
        },
        generateUniqueIdentifier: () => uuid(),
      });
      resumable.on('filesAdded', (...args) => this.filesAdded(...args));
      resumable.on('fileProgress', (...args) => this.fileUploadProgress(...args));
      resumable.on('fileSuccess', (...args) => this.fileUploadSuccess(...args));
      resumable.on('fileError', (...args) => this.fileUploadFailure(...args));
      resumablePerSpaceMap.set(targetSpace, resumable);
    }

    return resumablePerSpaceMap.get(targetSpace);
  },

  /**
   * @returns {Promise<string>}
   */
  getAuthToken() {
    const {
      tokenRegenerateTimestamp,
      tokenProxy,
    } = this.getProperties('tokenRegenerateTimestamp', 'tokenProxy');
    const nowTimestamp = moment().unix();

    if (tokenRegenerateTimestamp <= nowTimestamp) {
      // When new token will be loading, disable token regeneration
      this.set('tokenRegenerateTimestamp', nowTimestamp + 9999999);

      const newTokenPromise = getGuiAuthToken();
      const newTokenProxy = PromiseObject.create({
        promise: newTokenPromise.then(({ token }) => token),
      });
      newTokenPromise
        .then(({ ttl }) => safeExec(this, () =>
          // After successfull generation, set regeneration timestamp to the
          // half of the token lifetime.
          this.set('tokenRegenerateTimestamp', moment().unix() + ttl / 2)
        ))
        .catch(() => safeExec(this, () => this.set('tokenExpirationTimestamp', 0)));

      if (tokenProxy) {
        newTokenProxy
          .then(() => safeExec(this, () => this.set('tokenProxy', newTokenProxy)));
        return tokenProxy;
      } else {
        return this.set('tokenProxy', newTokenProxy);
      }
    } else {
      return tokenProxy;
    }
  },

  notifyUploadInitialized(resumableFile) {
    const notifyObject = {
      uploadId: resumableFile.uploadId,
      path: resumableFile.relativePath,
      fileId: get(resumableFile, 'fileModel.entityId'),
      spaceId: get(resumableFile, 'fileModel.spaceEntityId'),
    };
    this.notifyParent(notifyObject, 'uploadInitialized');
  },

  /**
   * Event handler for Resumable.js
   * @param {Array<ResumableFile>} resumableFiles
   * @returns {undefined}
   */
  filesAdded(resumableFiles) {
    const {
      targetDirectory,
      resumable,
    } = this.getProperties('targetDirectory', 'resumable');

    if (get(targetDirectory, 'dataIsProtected')) {
      resumableFiles.forEach(resumableFile => resumableFile.cancel());
      return;
    }

    const uploadId = uuid();
    const createdDirectories = {};

    resumableFiles.setEach('uploadId', uploadId);
    resumableFiles.setEach('targetRootDirectory', targetDirectory);
    resumableFiles.setEach('createdDirectories', createdDirectories);

    // Sort files to optimize directories creation
    const filesTree = buildFilesTree(resumableFiles);
    const sortedFiles = sortFilesToUpload(filesTree);

    // Remove added files...
    for (let i = 0; i < resumableFiles.length; i++) {
      resumable.files.pop();
    }
    // ... and restore them in changed order
    for (let i = 0; i < resumableFiles.length; i++) {
      resumable.files.push(sortedFiles[i]);
    }

    const notifyObject = {
      uploadId,
      files: resumableFiles.map(file => ({
        path: file.relativePath,
        size: file.size,
      })),
    };
    this.notifyParent(notifyObject, 'addNewUpload');

    resumable.upload();
  },

  /**
   * Event handler for Resumable.js
   * @param {ResumableFile} resumableFile
   * @returns {undefined}
   */
  fileUploadProgress(resumableFile) {
    const progress = resumableFile.progress();
    const isComplete = resumableFile.isComplete();
    // Notifying about 0% progress is not useful. Also sometimes Resumable
    // treats cancelled files as finished
    const isFakeComplete =
      progress === 1 && (resumableFile.isCancelled || !isComplete);
    if (progress > 0 && !isComplete && !isFakeComplete) {
      const throttledUploadProgress = this.get('throttledUploadProgress');
      const throttledUploadProgressKey = getProgressThrottlerKey(resumableFile);

      if (!throttledUploadProgress[throttledUploadProgressKey]) {
        const notifyProgressCallback = progress => {
          this.notifyParent({
            uploadId: resumableFile.uploadId,
            path: resumableFile.relativePath,
            bytesUploaded: Math.floor(progress * resumableFile.size),
          });
        };
        throttledUploadProgress[throttledUploadProgressKey] =
          progress => throttle(this, notifyProgressCallback, progress, 500);
      }

      throttledUploadProgress[throttledUploadProgressKey](progress);
    }
  },

  /**
   * Event handler for Resumable.js
   * @param {ResumableFile} resumableFile
   * @returns {undefined}
   */
  fileUploadSuccess(resumableFile) {
    // Sometimes Resumable treats cancelled files as finished
    if (!resumableFile.isCancelled) {
      this.finalizeFileUpload(resumableFile)
        .then(() => {
          this.notifyParent({
            uploadId: resumableFile.uploadId,
            path: resumableFile.relativePath,
            bytesUploaded: resumableFile.size,
            success: true,
          });
          resumableFile.fileModel.pollSize(2000, resumableFile.size, 10);
        })
        .catch(error => {
          const errorMessage = get(
            this.get('errorExtractor').getMessage(error),
            'message.string'
          ) || this.t('unknownError');
          this.notifyParent({
            uploadId: resumableFile.uploadId,
            path: resumableFile.relativePath,
            error: errorMessage,
          });

          this.deleteFailedFile(resumableFile);
        });
    }
  },

  /**
   * Event handler for Resumable.js
   * @param {ResumableFile} resumableFile
   * @param {string} message
   * @returns {undefined}
   */
  fileUploadFailure(resumableFile, message) {
    let stringMessage;
    try {
      const parsedMessage = (JSON.parse(message) || {}).error || message;
      stringMessage = get(
        this.get('errorExtractor').getMessage(parsedMessage),
        'message.string'
      ) || JSON.stringify(message);
    } catch (e) {
      stringMessage = message;
    }
    this.notifyParent({
      uploadId: resumableFile.uploadId,
      path: resumableFile.relativePath,
      error: stringMessage || this.t('unknownError'),
    });

    // GUI does not have to wait for result, because error has been already
    // passed to Onezone.
    this.deleteFailedFile(resumableFile)
      .finally(() => this.finalizeFileUpload(resumableFile));
  },

  /**
   * Initializes upload of given file.
   * @param {ResumableFile} resumableFile
   * @returns {Promise}
   */
  initializeFileUpload(resumableFile) {
    if (!resumableFile.isUploadInitialized) {
      return this.get('fileManager')
        .initializeFileUpload(get(resumableFile, 'fileModel'))
        .then(() => resumableFile.isUploadInitialized = true);
    } else {
      return resolve();
    }
  },

  /**
   * Ends upload of given file.
   * @param {ResumableFile} resumableFile
   * @returns {Promise}
   */
  finalizeFileUpload(resumableFile) {
    const progressThrottlerKey = getProgressThrottlerKey(resumableFile);
    delete this.get('throttledUploadProgress')[progressThrottlerKey];
    if (resumableFile.isUploadInitialized) {
      return this.get('fileManager')
        .finalizeFileUpload(get(resumableFile, 'fileModel'));
    } else {
      return resolve();
    }
  },

  /**
   * Deletes file, that was used as a target for failed upload.
   * @param {ResumableFile} resumableFile
   * @returns {Promise}
   */
  deleteFailedFile(resumableFile) {
    const fileModelPromise = resumableFile.createFileModelPromise ||
      resolve(resumableFile.fileModel);
    return fileModelPromise.then(fileModel => {
      if (fileModel && !get(fileModel, 'isDeleted')) {
        return get(fileModel, 'parent').then(parent => {
          return fileModel.destroyRecord().then(() =>
            this.refreshDirectoryChildren(parent)
          );
        });
      }
    });
  },

  /**
   * Makes `dropElement` a target for drag-n-drop upload
   * @param {HTMLElement} dropElement
   * @returns {undefined}
   */
  assignUploadDrop(dropElement) {
    if (dropElement === this.get('dropElement')) {
      return;
    }

    this.set('dropElement', dropElement);
    this.get('resumable').assignDrop(dropElement);

    let lastEnter;
    const startDrag = function (event) {
      lastEnter = event.target;
      dropElement.classList.add('file-drag');
    };

    const endDrag = function (event) {
      if (lastEnter === event.target) {
        dropElement.classList.remove('file-drag');
      }
    };

    dropElement.addEventListener('dragenter', startDrag);
    dropElement.addEventListener('dragleave', endDrag);
    dropElement.addEventListener('dragend', endDrag);
    dropElement.addEventListener('drop', endDrag);
  },

  /**
   * Makes `browseElement` a target for browse upload
   * @param {HTMLElement} browseElement
   * @returns{undefined}
   */
  assignUploadBrowse(browseElement) {
    if (this.get('browseElement') === browseElement) {
      return;
    }

    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('multiple', 'multiple');
    input.style.display = 'none';
    browseElement.addEventListener('click', () => {
      input.style.opacity = 0;
      input.style.display = 'block';
      input.focus();
      input.click();
      input.style.display = 'none';
    }, false);
    browseElement.appendChild(input);

    input.addEventListener('change', event => {
      this.getResumable().addFiles(event.target.files, event);
      event.target.value = '';
    }, false);

    this.set('browseElement', browseElement);
  },

  /**
   * @returns {undefined}
   */
  triggerUploadDialog() {
    const browseElement = this.get('browseElement');
    if (browseElement) {
      browseElement.click();
    }
  },

  /**
   * Changes target space where files should be uploaded
   * @param {Models.Space} targetSpace
   * @returns {undefined}
   */
  changeTargetSpace(targetSpace) {
    if (this.get('targetSpace') !== targetSpace) {
      const oldResumable = this.getResumable();
      const dropElement = this.get('dropElement');

      if (dropElement) {
        oldResumable.unAssignDrop(dropElement);
      }

      this.set('targetSpace', targetSpace);

      const newResumable = this.getResumable();
      if (dropElement) {
        newResumable.assignDrop(dropElement);
      }
    }
  },

  /**
   * Changes target directory where files should be uploaded
   * @param {Models.File} targetDirectory
   * @returns {undefined}
   */
  changeTargetDirectory(targetDirectory) {
    this.set('targetDirectory', targetDirectory);
  },

  /**
   * Notifies Onezone about upload state change
   * @param {Object} notifyObject
   * @param {string} method
   * @returns {undefined}
   */
  notifyParent(notifyObject, method = 'updateUploadProgress') {
    this.get('appProxy').callParent(method, notifyObject);
  },

  refreshDirectoryChildren(directory) {
    const dirId = get(directory, 'entityId');
    const throttledRefresh = this.get('throttledRefresh');
    if (!throttledRefresh[dirId]) {
      throttledRefresh[dirId] = createThrottledFunction(
        () => this.get('_refreshDirectoryChildrenFun')(dirId),
        1000
      );
    }
    throttledRefresh[dirId]();
  },

  /**
   * Creates directories which are needed to upload file. After that, an empty
   * file is created, that will be a target for upload. Created directories are
   * reused by the same batch upload - all files have the same
   * `createdDirectories` map to remember state of directories creation.
   * @param {ResumableFile} resumableFile
   * @returns {Promise<Models.File>}
   */
  createCorrespondingFile(resumableFile) {
    const fileManager = this.get('fileManager');
    const pathSections = get(resumableFile, 'relativePath').split('/');

    // Root upload directory is already created, so just resolve
    let createPromise = resolve(resumableFile.targetRootDirectory);
    // If file is in nested directory...
    if (pathSections.length > 1) {
      const createdDirectories = resumableFile.createdDirectories;
      // iterate over all nested directories in file path...
      for (let i = 0; i < pathSections.length - 1; i++) {
        const directoryPath = pathSections.slice(0, i + 1).join('/');
        // when parent diretory is created, then...
        createPromise = createPromise.then(parent => {
          // reuse existing (ealier created) directory if possible...
          let nextLevelDirPromise = createdDirectories[directoryPath];
          // or create a new one and remember Promise to reuse it later for
          // another files.
          if (!nextLevelDirPromise) {
            nextLevelDirPromise = fileManager.createDirectory(pathSections[i],
              parent, 50);
            createdDirectories[directoryPath] = nextLevelDirPromise;
            nextLevelDirPromise.then(() => this.refreshDirectoryChildren(parent));
          }
          return nextLevelDirPromise;
        });
      }
    }

    return createPromise.then(parent => {
      // When all directories needed to upload file are created, create file itself.
      const createFileModelPromise =
        fileManager.createFile(get(pathSections, 'lastObject'), parent, 50);
      createFileModelPromise.then((fileModel) => {
        this.refreshDirectoryChildren(parent);
        resumableFile.createFileModelPromise = null;
        resumableFile.fileModel = fileModel;
      });
      resumableFile.createFileModelPromise = createFileModelPromise;
      return createFileModelPromise;
    });
  },
});

/**
 * Builds a simple tree representation of passed files similar to:
 * {
 *   dir1Name: {
 *     subdir11Name: {
 *       file111Name: ResumableFile,
 *     }
 *     ... other directories ...
 *     file11Name: ResumableFile,
 *     file12Name: ResumableFile,
 *     ... other files ...
 *   }
 *   ... other directories ...
 *   file1Name: ResumableFile,
 *   ... other files ...
 * }
 * @param {Array<ResumableFile>} resumableFiles
 * @returns {Object}
 */
function buildFilesTree(resumableFiles) {
  const tree = {};

  resumableFiles.forEach(resumableFile => {
    const pathSections = get(resumableFile, 'relativePath').split('/');
    let targetDirectory = tree;
    for (let i = 0; i < pathSections.length - 1; i++) {
      const pathSection = pathSections[i];
      if (!targetDirectory[pathSection]) {
        targetDirectory[pathSection] = {};
      }
      targetDirectory = targetDirectory[pathSection];
    }
    targetDirectory[get(pathSections, 'lastObject')] = resumableFile;
  });

  return tree;
}

/**
 * Converts tree back to array of files, but ordered in a way, that minimizes
 * the number of unnecessary created directories in case of file upload failure.
 * Order: 'Files first, then run itself recurrently on each directory`.
 * @param {Object} tree
 * @returns {Array<ResumableFile>}
 */
function sortFilesToUpload(tree) {
  const filesAndDirs = Object.keys(tree).sort().map(key => tree[key]);

  const files = filesAndDirs
    .filter(file => isResumableFile(file));
  const directories = _.difference(filesAndDirs, files);

  return files.concat(...directories.map(sortFilesToUpload));
}

/**
 * Returns true if passed object is a ResumableFile
 * @param {any} object
 * @returns {boolean}
 */
function isResumableFile(object) {
  return object && typeof object.progress === 'function';
}

function getProgressThrottlerKey(resumableFile) {
  return `${resumableFile.uploadId}|${resumableFile.relativePath}`;
}
