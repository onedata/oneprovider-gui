/**
 * Provides model functions related to files and directories.
 *
 * @module services/production/file-manager
 * @author Michał Borzęcki, Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { resolve, allSettled } from 'rsvp';
import { get, computed } from '@ember/object';
import gri from 'onedata-gui-websocket-client/utils/gri';
import _ from 'lodash';
import { entityType as fileEntityType, getFileGri } from 'oneprovider-gui/models/file';

const childrenAttrsAspect = 'children_details';
const fileModelName = 'file';

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
   * @param {String} scope one of: private, public
   * @returns {Promise<Models.File>}
   */
  getFileById(fileId, scope = 'private') {
    const fileGri = getFileGri(fileId, scope);
    return this.get('store').findRecord(fileModelName, fileGri);
  },

  /**
   * Creates child element in given directory.
   * @param {Models.File} directory
   * @param {String} type
   * @param {String} name
   * @param {Object|undefined} creationOptions
   * @returns {Promise<Models.File>}
   */
  createDirectoryChild(directory, type, name, creationOptions = undefined) {
    const _meta = creationOptions && Object.keys(creationOptions).length ? {
      additionalData: creationOptions,
    } : undefined;

    return this.get('store').createRecord(fileModelName, {
      type,
      name,
      parent: directory,
      _meta,
    }).save();
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
    const creationOptions = createAttempts ? { createAttempts } : undefined;
    return this.createDirectoryChild(parent, type, name, creationOptions);
  },

  /**
   * Creates new file
   * @param {string} name
   * @param {Models.File} parent
   * @param {number} [createAttempts=undefined]
   * @returns {Promise<Models.File>}
   */
  createFile(name, parent, createAttempts = undefined) {
    return this.createFileOrDirectory(fileModelName, name, parent, createAttempts);
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
   * Creates new symlink to a given path
   * @param {String} name
   * @param {Models.File} parent
   * @param {String} targetPath
   * @returns {Promise<Models.File>}
   */
  createSymlink(name, parent, targetPath) {
    return this.createDirectoryChild(parent, 'symlink', name, { targetPath });
  },

  /**
   * Creates new hardlink to a given file
   * @param {String} name
   * @param {Models.File} parent
   * @param {Models.File} target
   * @returns {Promise<Models.File>}
   */
  createHardlink(name, parent, target) {
    return this.createDirectoryChild(parent, 'hardlink', name, {
      targetGuid: get(target, 'entityId'),
    });
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

  /**
   * @param {String} dirId entityId of parent dir
   * @param {String} scope one of: private, public
   * @param {String} index file.index that the listing should start
   * @param {Number} limit
   * @param {Number} offset
   * @returns {Promise<{ childrenRecords: Array<Models.File>, isLast: Boolean }>}
   */
  fetchDirChildren(dirId, scope, index, limit, offset) {
    if (!limit || limit <= 0) {
      return resolve([]);
    } else {
      return this.fetchChildrenAttrs({
        dirId,
        scope,
        index,
        limit,
        offset,
      }).then(({ children, isLast }) => {
        const childrenRecords = this.pushChildrenAttrsToStore(children, scope);
        return { childrenRecords, isLast };
      });
    }
  },

  /**
   * @param {Array<Object>} childrenAttrs data for creating File model
   * @param {String} scope one of: private, public
   * @returns {Array<Record>}
   */
  pushChildrenAttrsToStore(childrenAttrs, scope) {
    const store = this.get('store');
    return childrenAttrs.map(fileAttrs => {
      fileAttrs.scope = scope;
      const modelData = store.normalize(fileModelName, fileAttrs);
      return store.push(modelData);
    });
  },

  /**
   * @returns {Promise<{ children: Array, isLast: Boolean }>}
   */
  fetchChildrenAttrs({ dirId, scope, index, limit, offset }) {
    const requestGri = gri({
      entityId: dirId,
      entityType: fileEntityType,
      aspect: childrenAttrsAspect,
      scope,
    });
    return this.get('onedataGraph').request({
      operation: 'get',
      gri: requestGri,
      data: {
        index,
        limit,
        offset,
      },
      subscribe: false,
    });
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

  getFileDownloadUrl(fileIds, scope = 'private') {
    return this.get('onedataGraph').request({
      operation: 'get',
      gri: gri({
        entityType: fileEntityType,
        entityId: null,
        aspect: 'download_url',
        scope,
      }),
      data: {
        file_ids: fileIds,
      },
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
