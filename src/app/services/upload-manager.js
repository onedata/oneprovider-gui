/**
 * Manages uploading files using resumable.js and external state of upload
 * received from Onezone.
 * 
 * @module services/upload-manager
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import EmberObject, { computed, observer, get, getProperties } from '@ember/object';
import { reads } from '@ember/object/computed';
import Resumable from 'npm:resumablejs';
import { resolve } from 'rsvp';
import { getOwner } from '@ember/application';
import getGuiAuthToken from 'onedata-gui-websocket-client/utils/get-gui-auth-token';

// TODO:
// - get oneproviderApiOrigin for targetUrl in resumable
// - get authToken for X-Auth-Token in resumable (maybe with getGuiAuthToken from websocket-client),
//   but it need initialization due to async character
// - add parentId to each resumable file at `fileAdded` event
// - startNewUploadSession method

export default Service.extend({
  appProxy: service(),
  store: service(),
  fileManager: service(),
  fileServer: service(),
  onedataRpc: service(),

  /**
   * @type {Ember.ComputedProperty<EmberObject>}
   */
  uniqueIdentifierCounter: computed(() => EmberObject.create({
    file: -1,
    upload: -1,
  })),

  /**
   * Id of directory where files should be uploaded
   * @type {Models.File}
   */
  targetDirectory: undefined,

  /**
   * @type {Ember.ComputedProperty<Object>}
   */
  injectedUploadState: reads('appProxy.injectedData.uploadFiles'),

  resumable: computed(function resumable() {
    const oneproviderApiOrigin = getOwner(this).application.guiContext.apiOrigin;
    return new Resumable({
      target: `https://${oneproviderApiOrigin}/file_upload`,
      chunkSize: 1 * 1024 * 1024,
      simultaneousUploads: 4,
      testChunks: false,
      minFileSize: 0,
      throttleProgressCallbacks: 1,
      permanentErrors: [400, 404, 405, 415, 500, 501],
      identifierParameterName: null,
      preprocess: (fileChunk) => {
        const file = fileChunk.fileObj;
        if(!file.createFilePromise) {
          file.createFilePromise = this.createCorrespondingFile(file)
          .then(fileModel => {
            file.fileModel = fileModel;
            return this.get('onedataRpc')
              .request('initializeFileUpload', { guid: get(fileModel, 'entityId') });
          });
        }
        file.createFilePromise.then(() => fileChunk.preprocessFinished());
      },
      headers: () => {
        return { 'X-Auth-Token': this.get('token') };
      },
      query(file) {
        return { guid: get(file.fileModel, 'entityId') };
      },
      generateUniqueIdentifier: () => this.generateUniqueIdentifier('file'),
    });
  }),

  injectedUploadStateObserver: observer(
    'injectedUploadState',
    function injectedUploadStateObserver() {
      const {
        injectedUploadState,
        resumable,
      } = this.getProperties('injectedUploadState', 'resumable');

      if (injectedUploadState) {
        // cancel all uploads, that are not present in injected list
        get(resumable, 'files')
          .reject(resumableFile => {
            const {
              uploadId,
              relativePath,
            } = getProperties(resumableFile, 'uploadId', 'relativePath');
            const upload = injectedUploadState[uploadId];
            return upload && get(upload, 'files').findBy('path', relativePath);
          })
          .invoke('cancel');
      }
    }
  ),

  init() {
    this._super(...arguments);

    getGuiAuthToken().then(token => {
      this.set('token', token);

      const resumable = this.get('resumable');
      resumable.on('filesAdded', (files) => this.filesAdded(files));
      resumable.on('fileProgress', (...args) => this.fileUploadProgress(...args));
      resumable.on('fileSuccess', (file) => this.fileUploadSuccess(file));
      resumable.on('fileError', (file) => this.fileUploadFailure(file));

      this.injectedUploadStateObserver();
    });
  },

  /**
   * @param {string} type `file` or `upload`
   * @returns {string}
   */
  generateUniqueIdentifier(type) {
    return String(this.get('uniqueIdentifierCounter').incrementProperty(type));
  },

  /**
   * Event handler for Resumable.js
   * @param {Array<ResumableFile>} files
   * @returns {undefined}
   */
  filesAdded(files) {
    const {
      targetDirectory,
      resumable,
    } = this.getProperties('targetDirectory', 'resumable');
    
    const uploadId = this.generateUniqueIdentifier('upload');
    const createdDirectories = {};

    files.setEach('uploadId', uploadId);
    files.setEach('targetRootDirectory', targetDirectory);
    files.setEach('createdDirectories', createdDirectories);

    const filesTree = buildFilesTree(files);
    const sortedFiles = sortFilesToUpload(filesTree);

    for (let i = 0; i < files.length; i++) {
      resumable.files.pop();
    }
    for (let i = 0; i < files.length; i++) {
      resumable.files.push(sortedFiles[i]);
    }

    const notifyObject = {
      uploadId,
      files: files.map(file => ({
        path: file.relativePath,
        size: file.size,
      })),
    };
    this.notifyParent(notifyObject, 'addNewUpload');

    this.get('resumable').upload();
  },

  /**
   * Event handler for Resumable.js
   * @param {ResumableFile} file
   * @returns {undefined}
   */
  fileUploadProgress(file) {
    const progress = file.progress();
    // Notifying about 0% progress is not useful
    if (progress > 0) {
      const notifyObject = {
        uploadId: file.uploadId,
        path: file.relativePath,
        bytesUploaded: Math.floor(file.progress() * file.size),
      };
      this.notifyParent(notifyObject);
    }
  },

  /**
   * Event handler for Resumable.js
   * @param {ResumableFile} file
   * @returns {undefined}
   */
  fileUploadSuccess(file) {
    this.get('onedataRpc')
      .request('finalizeFileUpload', { guid: get(file, 'fileModel.entityId') });
    const notifyObject = {
      uploadId: file.uploadId,
      path: file.relativePath,
      bytesUploaded: file.size,
      success: true,
    };
    this.notifyParent(notifyObject);
  },

  /**
   * Event handler for Resumable.js
   * @param {ResumableFile} file
   * @param {string} message
   * @returns {undefined}
   */
  fileUploadFailure(file, message) {
    const notifyObject = {
      uploadId: file.uploadId,
      path: file.relativePath,
      error: message,
    };
    this.notifyParent(notifyObject);
  },

  /**
   * Makes `dropElement` a target for drag-n-drop upload
   * @param {HTMLElement} dropElement
   * @return {undefined}
   */
  assignUploadDrop(dropElement) {
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
   * @return {undefined}
   */
  assignUploadBrowse(browseElement) {
    this.get('resumable').assignBrowse(browseElement);
  },

  /**
   * Creates new upload session to group all files in the same upload
   * @returns {Promise<{ uploadId: string }>}
   */
  startNewUploadSession() {
    return resolve({ uploadId: String(Math.floor(Math.random() * 1000000)) });
  },

  /**
   * Changes target directory ID where files should be uploaded
   * @param {string} targetDirectoryId 
   * @returns {undefined}
   */
  changeTargetDirectoryId(targetDirectoryId) {
    this.set('targetDirectoryId', targetDirectoryId);
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

  /**
   * @param {ResumableFile} file
   * @returns {Promise<Models.File>}
   */
  createCorrespondingFile(file) {
    const {
      fileManager,
      fileServer,
    } = this.getProperties('fileManager', 'fileServer');
    const pathSections = get(file, 'relativePath').split('/');

    let createPromise = resolve(file.targetRootDirectory);
    if (pathSections.length > 1) {
      const createdDirectories = file.createdDirectories;
      for (let i = 0; i < pathSections.length - 1; i++) {
        const directoryPath = pathSections.slice(0, i + 1).join('/');

        createPromise = createPromise.then(parent => {
          let nextLevelDirPromise = createdDirectories[directoryPath];
          if (!nextLevelDirPromise) {
            nextLevelDirPromise = fileManager.createDirectory(pathSections[i], parent, 50);
            createdDirectories[directoryPath] = nextLevelDirPromise;
            nextLevelDirPromise.then(() => fileServer.trigger('dirChildrenRefresh', parent));
          }
          return nextLevelDirPromise;
        });
      }
    }

    return createPromise.then(parent => {
      const createFilePromise =
        fileManager.createFile(get(pathSections, 'lastObject'), parent, 50);
      createFilePromise.then(() => fileServer.trigger('dirChildrenRefresh', parent));
      return createFilePromise;
    });
  },
});


/**
 * @param {Array<ResumableFile>} files
 * @returns {Object}
 */
function buildFilesTree(files) {
  const tree = {};

  files.forEach(file => {
    const pathSections = get(file, 'relativePath').split('/');
    let targetDirectory = tree;
    for (let i = 0; i < pathSections.length - 1; i++) {
      const pathSection = pathSections[i];
      if (!targetDirectory[pathSection]) {
        targetDirectory[pathSection] = {};
      }
      targetDirectory = targetDirectory[pathSection];
    }
    targetDirectory[get(pathSections, 'lastObject')] = file;
  });

  return tree;
}

function sortFilesToUpload(tree) {
  const filesAndDirs = Object.keys(tree).sort().map(key => tree[key]);

  const files = filesAndDirs
    .filter(file => typeof file.progress === 'function');
  const directories = filesAndDirs
    .filter(file => !files.includes(file));

  return files.concat(...directories.map(sortFilesToUpload));
}
