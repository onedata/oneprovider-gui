/**
 * Manages uploading files using resumable.js and external state of upload
 * received from Onezone.
 * 
 * @module services/uploading-manager
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { computed, observer, get, getProperties } from '@ember/object';
import { reads } from '@ember/object/computed';
import Resumable from 'npm:resumablejs';
import { v4 as uuidV4 } from 'ember-uuid';
import { resolve } from 'rsvp';

// TODO
// - get oneproviderApiOrigin for targetUrl in resumable
// - get authToken for X-Auth-Token in resumable (maybe with getGuiAuthToken from websocket-client),
//   but it need initialization due to async character
// - add parentId to each resumable file at `fileAdded` event
// - startNewUploadSession method

export default Service.extend({
  appProxy: service(),

  /**
   * Id of directory where files should be uploaded
   * @type {string}
   */
  targetDirectoryId: undefined,

  /**
   * @type {Ember.ComputedProperty<Object>}
   */
  injectedUploadState: reads('appProxy.injectedData.uploadingFiles'),

  resumable: computed(function resumable() {
    const oneproviderApiOrigin = '???';
    const authToken = '???';
    return new Resumable({
      target: `https://${oneproviderApiOrigin}/upload`,
      chunkSize: 1 * 1024 * 1024,
      simultaneousUploads: 4,
      testChunks: false,
      minFileSize: 0,
      throttleProgressCallbacks: 1,
      permanentErrors: [400, 404, 405, 415, 500, 501],
      headers: {
        'X-Auth-Token': authToken,
      },
      query(file) {
        return {
          uploadId: file.uploadId,
          parentId: file.parentId,
        };
      },
      generateUniqueIdentifier() {
        return uuidV4();
      },
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

    const resumable = this.get('resumable');
    resumable.on('filesAdded', (files) => this.filesAdded(files));
    resumable.on('fileProgress', (...args) => this.fileUploadProgress(...args));
    resumable.on('fileSuccess', (file) => this.fileUploadSuccess(file));
    resumable.on('fileError', (file) => this.fileUploadFailure(file));

    this.injectedUploadStateObserver();
  },

  /**
   * Event handler for Resumable.js
   * @param {Array<ResumableFile>} files
   * @returns {undefined}
   */
  filesAdded(files) {
    const targetDirectoryId = this.get('targetDirectoryId');
    files.forEach(file => file.targetDirectoryId = targetDirectoryId);

    this.startNewUploadSession()
      .then(({ uploadId }) => {
        files.setEach('uploadId', uploadId);
        const notifyObject = {
          uploadId,
          files: files.map(file => ({
            path: file.relativePath,
            size: file.size,
          })),
        };
        this.notifyParent(notifyObject, 'addNewUpload');
      })
      .catch((/* error */) => {
        files.invoke('cancel');
        // TODO global-notify with error depending on whether or not errors
        // should be shown from backend
      });
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
  assignUploadingDrop(dropElement) {
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
  assignUploadingBrowse(browseElement) {
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
});
