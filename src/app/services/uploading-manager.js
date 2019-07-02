import Service from '@ember/service';
import { computed } from '@ember/object';
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
  /**
   * Id of directory where files should be uploaded
   * @type {string}
   */
  targetDirectoryId: undefined,

  resumable: computed(function resumable() {
    const oneproviderApiOrigin = '???';
    const authToken = '???';
    return new Resumable({
      target: `https://${oneproviderApiOrigin}/upload`,
      chunkSize: 1 * 1024 * 1024,
      simultaneousUploads: 4,
      testChunks: false,
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

  init() {
    this._super(...arguments);

    const resumable = this.get('resumable');
    resumable.on('filesAdded', (files) => this.filesAdded(files));
    resumable.on('fileProgress', (...args) => this.fileUploadProgress(...args));
    resumable.on('fileSuccess', (file) => this.fileUploadSuccess(file));
    resumable.on('fileError', (file) => this.fileUploadFailure(file));
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
        files.forEach(file => file.uploadId = uploadId);
        const notifyObject = {
          uploadId,
          files: files.map(file => ({
            path: file.relativePath,
            size: file.size,
          })),
        };
        // TODO notify OZ
        console.log(notifyObject);
      })
      .catch((/* error */) => {
        files.invoke('cancel');
        // TODO global-notify with error
      });   
    console.log('filesAdded');
    console.log(arguments);
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
      console.log(notifyObject);
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
    };
    console.log(notifyObject);
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
    console.log(notifyObject);
  },

  /**
   * Makes `dropElement` a target for drag-n-drop upload
   * @param {HTMLElement} dropElement
   * @return {undefined}
   */
  assignUploadingDrop(dropElement) {
    this.get('resumable').assignDrop(dropElement);
  },

  /**
   * Makes `dropElement` a target for browse upload
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
});
