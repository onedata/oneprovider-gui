/**
 * Provides model functions related to files and directories.
 * 
 * @module services/file-manager
 * @author Michał Borzęcki, Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { resolve, all } from 'rsvp';
import Evented from '@ember/object/evented';
import { get } from '@ember/object';

export default Service.extend(Evented, {
  store: service(),
  onedataRpc: service(),

  fileClipboardMode: undefined,

  fileClipboardFiles: undefined,

  init() {
    this._super(...arguments);
    this.clearFileClipboard();
  },

  clearFileClipboard() {
    this.setProperties({
      fileClipboardMode: null,
      fileClipboardFiles: [],
    });
  },

  /**
   * Creates new file or directory
   * @param {string} type `file` or `dir`
   * @param {string} name 
   * @param {Models.File} parent 
   * @param {number} [createAttempts=undefined]
   * @returns {Promise<Models.File>}
   */
  createFileOrDirectory(type, name, parent, createAttempts = undefined) {
    let _meta;
    if (createAttempts) {
      _meta = {
        additionalData: {
          createAttempts,
        },
      };
    }

    return this.get('store').createRecord('file', {
      type,
      name,
      parent,
      _meta,
    }).save();
  },

  /**
   * Creates new file
   * @param {string} name 
   * @param {Models.File} parent 
   * @param {number} [createAttempts=undefined]
   * @returns {Promise<Models.File>}
   */
  createFile(name, parent, createAttempts = undefined) {
    return this.createFileOrDirectory('file', name, parent, createAttempts);
  },

  /**
   * Creates new directory
   * @param {string} name 
   * @param {Models.File} parent 
   * @param {number} [createAttempts=undefined]
   * @returns {Promise<Models.File>}
   */
  createDirectory(name, parent, createAttempts = undefined) {
    return this.createFileOrDirectory('dir', name, parent, createAttempts);
  },

  /**
   * Sends an RPC call that initializes upload of given file.
   * @param {Models.File} file
   * @returns {Promise}
   */
  initializeFileUpload(file) {
    return this.get('onedataRpc').request('initializeFileUpload', {
      guid: get(file, 'entityId'),
    });
  },

  /**
   * Sends an RPC call that ends upload of given file.
   * @param {Models.File} file 
   * @returns {Promise}
   */
  finalizeFileUpload(file) {
    return this.get('onedataRpc').request('finalizeFileUpload', {
      guid: get(file, 'entityId'),
    });
  },

  fetchDirChildren(dirId, startFromIndex, size, offset) {
    const {
      store,
      onedataRpc,
    } = this.getProperties('store', 'onedataRpc');
    if (!size || size <= 0) {
      return resolve([]);
    } else {
      return onedataRpc
        .request('getDirChildren', {
          guid: dirId,
          index: startFromIndex,
          limit: size,
          offset,
        })
        .then(fileIds => all(fileIds.map(id => store.findRecord('file', id))));
    }
  },

  renameFile(fileEntityId, parentDirEntityId, targetName) {
    return this.get('onedataRpc').request('moveFile', {
      guid: fileEntityId,
      targetParentGuid: parentDirEntityId,
      targetName,
    });
  },

  copyFile(file, parentDirEntityId) {
    return this.copyOrMoveFile(file, parentDirEntityId, 'copy');
  },

  moveFile(file, parentDirEntityId) {
    return this.copyOrMoveFile(file, parentDirEntityId, 'move');
  },

  copyOrMoveFile(file, parentDirEntityId, operation) {
    const name = get(file, 'name');
    const entityId = get(file, 'entityId');
    return this.get('onedataRpc')
      .request(`${operation}File`, {
        guid: entityId,
        targetParentGuid: parentDirEntityId,
        targetName: name,
      })
      .finally(() => this.trigger('dirChildrenRefresh', parentDirEntityId));
  },

  getFileDownloadUrl(fileEntityId) {
    return this.get('onedataRpc').request('getFileDownloadUrl', {
      guid: fileEntityId,
    });
  },

  dirChildrenRefresh(parentDirEntityId) {
    return this.trigger('dirChildrenRefresh', parentDirEntityId);
  },
});
