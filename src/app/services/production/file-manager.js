/**
 * Provides model functions related to files and directories.
 *
 * @module services/production/file-manager
 * @author Michał Borzęcki, Jakub Liput
 * @copyright (C) 2019-2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { resolve, allSettled, all as allFulfilled } from 'rsvp';
import { get, set, computed } from '@ember/object';
import gri from 'onedata-gui-websocket-client/utils/gri';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import _ from 'lodash';
import { entityType as fileEntityType, getFileGri } from 'oneprovider-gui/models/file';
import { generateAbsoluteSymlinkPathPrefix } from 'oneprovider-gui/utils/symlink-utils';

const childrenAttrsAspect = 'children_details';
const symlinkTargetAttrsAspect = 'symlink_target';
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
    return this.get('store').findRecord(fileModelName, fileGri)
      .then(file => this.resolveSymlinks([file], scope).then(() => file));
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
   * @param {String} targetPath must be an absolute path
   * @param {String} spaceId
   * @param {Number} [createAttempts=undefined]
   * @returns {Promise<Models.File>}
   */
  createSymlink(name, parent, targetPath, spaceId, createAttempts = undefined) {
    // Removing `/spacename` prefix from targetPath. Example '/s1/a/b' -> 'a/b'
    const absolutePathWithoutSpace = targetPath.split('/').slice(2).join('/');
    const pathPrefix = generateAbsoluteSymlinkPathPrefix(spaceId);
    const options = {
      targetPath: `${pathPrefix}/${absolutePathWithoutSpace}`,
    };
    if (createAttempts) {
      options.createAttempts = createAttempts;
    }

    return this.createDirectoryChild(parent, 'symlink', name, options);
  },

  /**
   * Creates new hardlink to a given file
   * @param {String} name
   * @param {Models.File} parent
   * @param {Models.File} target
   * @param {Number} [createAttempts=undefined]
   * @returns {Promise<Models.File>}
   */
  createHardlink(name, parent, target, createAttempts = undefined) {
    const options = {
      targetGuid: get(target, 'entityId'),
    };
    if (createAttempts) {
      options.createAttempts = createAttempts;
    }
    return this.createDirectoryChild(parent, 'hardlink', name, options);
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
      }).then(({ children, isLast }) =>
        this.pushChildrenAttrsToStore(children, scope)
        .then(childrenRecords =>
          this.resolveSymlinks(childrenRecords, scope).then(() => childrenRecords)
        )
        .then(childrenRecords => ({ childrenRecords, isLast }))
      );
    }
  },

  /**
   * @param {Array<Object>} childrenAttrs data for creating File model
   * @param {String} scope one of: private, public
   * @returns {Array<Record>}
   */
  pushChildrenAttrsToStore(childrenAttrs, scope) {
    const store = this.get('store');
    return resolve(childrenAttrs.map(fileAttrs => {
      fileAttrs.scope = scope;
      const modelData = store.normalize(fileModelName, fileAttrs);
      return store.push(modelData);
    }));
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

  resolveSymlinks(files, scope) {
    const symlinks = files.filterBy('type', 'symlink');
    return allFulfilled(symlinks.map(symlink =>
      this.fetchSymlinkTargetAttrs(get(symlink, 'entityId'), scope)
      .then(targetAttrs => this.pushChildrenAttrsToStore([targetAttrs], scope))
      .then(([targetRecord]) => set(symlink, 'symlinkTargetFile', targetRecord))
      .catch(() => set(symlink, 'symlinkTargetFile', null))
    ));
  },

  /**
   * @param {String} symlinkEntityId
   * @param {String} scope
   * @returns {Promise<Object>} attributes of symlink target
   */
  fetchSymlinkTargetAttrs(symlinkEntityId, scope) {
    const requestGri = gri({
      entityId: symlinkEntityId,
      entityType: fileEntityType,
      aspect: symlinkTargetAttrsAspect,
      scope,
    });
    return this.get('onedataGraph').request({
      operation: 'get',
      gri: requestGri,
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

  async getFileHardlinks(fileId, limit = 100) {
    const idsResult = await this.get('onedataGraph').request({
      operation: 'get',
      gri: gri({
        entityType: fileEntityType,
        entityId: fileId,
        aspect: 'hardlinks',
        scope: 'private',
      }),
      subscribe: false,
      data: {
        limit,
      },
    });
    const hardlinksIds = idsResult.hardlinks || [];
    return allSettled(
      hardlinksIds.map(hardlinkId =>
        this.getFileById(parseGri(hardlinkId).entityId))
    ).then(results => ({
      hardlinksCount: hardlinksIds.length,
      hardlinks: results.filterBy('state', 'fulfilled').mapBy('value'),
      errors: results.filterBy('state', 'rejected').mapBy('reason'),
    }));
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

  async fileParentRefresh(file) {
    const parentGri = file.belongsTo('parent').id();
    if (parentGri) {
      return await this.get('fileManager').dirChildrenRefresh(
        parseGri(parentGri).entityId
      );
    }
  },

  registerRefreshHandler(fileBrowserComponent) {
    this.get('fileTableComponents').push(fileBrowserComponent);
  },

  deregisterRefreshHandler(fileBrowserComponent) {
    _.pull(this.get('fileTableComponents'), fileBrowserComponent);
  },
});
