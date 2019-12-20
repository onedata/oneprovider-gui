/**
 * Provides model functions related to files and directories.
 * 
 * @module services/file-manager
 * @author Michał Borzęcki, Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { resolve, allSettled } from 'rsvp';
import { get, computed } from '@ember/object';
import gri from 'onedata-gui-websocket-client/utils/gri';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import _ from 'lodash';
import { entityType as fileEntityType } from 'oneprovider-gui/models/file';

class BrokenFile {
  constructor(id, reason) {
    this.id = id;
    this.entityId = parseGri(id).entityId;
    this.type = 'broken';
    this.error = reason;
  }
}

export default Service.extend({
  store: service(),
  onedataRpc: service(),
  onedataGraph: service(),

  /**
   * @type {Array<Ember.Component>}
   */
  fileTableComponents: computed(() => []),

  /**
   * @param {String} fileId 
   * @returns {Promise<Models.File>}
   */
  getFile(fileId) {
    const requestGri = gri({
      entityType: fileEntityType,
      entityId: fileId,
      aspect: 'instance',
      scope: 'private',
    });
    return this.get('store').findRecord('file', requestGri);
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
      onedataGraph,
    } = this.getProperties('store', 'onedataGraph');
    if (!size || size <= 0) {
      return resolve([]);
    } else {
      const requestGri = gri({
        entityId: dirId,
        entityType: fileEntityType,
        aspect: 'children',
      });
      return onedataGraph
        .request({
          operation: 'get',
          gri: requestGri,
          data: {
            // FIXME: to remove
            guid: dirId,
            index: startFromIndex,
            limit: size,
            offset,
          },
          subscribe: false,
        })
        .then(({ children }) => {
          const fileIds = children.map(entityId => gri({
            entityType: fileEntityType,
            entityId,
            aspect: 'instance',
            scope: 'private',
          }));
          const promises = allSettled(fileIds.map(id => {
            const cachedRecord = store.peekRecord('file', id);
            return cachedRecord ?
              resolve(cachedRecord) : store.findRecord('file', id);
          }));
          return promises.then(results => ([fileIds, results]));
        })
        .then(([fileIds, results]) => {
          const files = new Array(fileIds.length);
          for (let i = 0; i < fileIds.length; ++i) {
            const id = fileIds[i];
            const result = results[i];
            let file;
            if (result.state === 'fulfilled') {
              file = result.value;
            } else {
              file = new BrokenFile(id, result.reason);
            }
            files[i] = file;
          }
          return files;
        });
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
    const name = get(file, 'name') || 'unknown';
    const entityId = get(file, 'entityId');
    return this.get('onedataRpc')
      .request(`${operation}File`, {
        guid: entityId,
        targetParentGuid: parentDirEntityId,
        targetName: name,
      })
      .finally(() => this.dirChildrenRefresh(parentDirEntityId));
  },

  getFileDownloadUrl(fileEntityId) {
    return this.get('onedataGraph').request({
      operation: 'get',
      gri: gri({
        entityType: fileEntityType,
        entityId: fileEntityId,
        aspect: 'download_url',
        scope: 'private',
      }),
      subscribe: false,
    });
  },

  /**
   * Invokes request for refresh in all known file browser tables
   * @param {Array<object>} parentDirEntityId 
   * @returns {Array<object>}
   */
  dirChildrenRefresh(parentDirEntityId) {
    return allSettled(this.get('fileTableComponents').map(fileBrowser =>
      fileBrowser.onDirChildrenRefresh(parentDirEntityId)
    ));
  },

  registerRefreshHandler(fileBrowserComponent) {
    this.get('fileTableComponents').push(fileBrowserComponent);
  },

  deregisterRefreshHandler(fileBrowserComponent) {
    _.pull(this.get('fileTableComponents'), fileBrowserComponent);
  },
});
