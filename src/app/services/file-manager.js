/**
 * Provides model functions related to files and directories.
 * 
 * @module services/file-manager
 * @author Michał Borzęcki, Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { resolve, allSettled, all as allFulfilled } from 'rsvp';
import { get, computed } from '@ember/object';
import gri from 'onedata-gui-websocket-client/utils/gri';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import _ from 'lodash';
import { entityType as fileEntityType } from 'oneprovider-gui/models/file';
import { aspect as shareListAspect } from 'oneprovider-gui/models/share-list';
import { entityType as userEntityType } from 'oneprovider-gui/models/user';
import { replicaEntityType } from 'oneprovider-gui/services/transfer-manager';
import { providerEntityType } from 'oneprovider-gui/services/transfer-manager';

const childrenAttrsAspect = 'children_details';
const fileModelName = 'file';

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

  adapter: computed(function adapter() {
    return this.get('store').adapterFor(fileModelName);
  }),

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
    const fileGri = this.getFileGr(fileId, scope);
    return this.get('store').findRecord(fileModelName, fileGri);
  },

  getFileGri(fileId, scope) {
    return gri({
      entityType: fileEntityType,
      entityId: fileId,
      aspect: 'instance',
      scope,
    });
  },

  getFileDataById(fileId, scope) {
    const requestGri = this.getFileGri(fileId, scope);
    return this.get('onedataGraph').request({
      operation: 'get',
      gri: requestGri,
      aspect: 'instance',
      subscribe: false,
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

    return this.get('store').createRecord(fileModelName, {
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
   * @returns {Promise<Array<Models.File>>}
   */
  fetchDirChildren(dirId, scope, index, limit, offset) {
    const store = this.get('store');
    if (!limit || limit <= 0) {
      return resolve([]);
    } else {
      // FIXME: legacy mode only for testing
      const legacyMode = false;
      if (legacyMode) {
        return this.fetchChildrenIds({
          dirId,
          scope,
          index,
          limit,
          offset,
        }).then(childrenIds => this.getChildrenFromStoreById(childrenIds, scope));
      } else {
        return this.fetchChildrenAttrsMock({
            dirId,
            scope,
            index,
            limit,
            offset,
          })
          .then(childrenAttrs =>
            childrenAttrs.map(fileAttrs => {
              const modelData = attrsToModel(fileAttrs);
              store.push(store.normalize(fileModelName, modelData));
              return store.peekRecord(fileModelName, get(modelData, 'gri'));
            })
          );
      }
    }
  },

  /**
   * @deprecated
   * @returns {Promise}
   */
  fetchChildrenIds({ dirId, scope, index, limit, offset }) {
    const requestGri = gri({
      entityId: dirId,
      entityType: fileEntityType,
      aspect: 'children',
      scope,
    });
    return this.get('onedataGraph')
      .request({
        operation: 'get',
        gri: requestGri,
        data: {
          index,
          limit,
          offset,
        },
        subscribe: false,
      })
      .then(({ children }) => children);
  },

  /**
   * @deprecated
   * @param {Array<String>} childrenIds
   * @param {String} scope
   * @returns {Promise}
   */
  getChildrenFromStoreById(childrenIds, scope) {
    const store = this.get('store');
    const fileIds = childrenIds.map(entityId => this.getFileGri(entityId, scope));
    const promises = allSettled(fileIds.map(id => {
      const cachedRecord = store.peekRecord(fileModelName, id);
      return cachedRecord ?
        resolve(cachedRecord) : store.findRecord(fileModelName, id);
    }));
    return promises.then(results => ([fileIds, results]))
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
  },

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

  // FIXME: mock method
  fetchChildrenAttrsMock({ dirId, scope, index, limit, offset }) {
    const {
      onedataGraph,
    } = this.getProperties('onedataGraph');
    const requestGri = gri({
      entityId: dirId,
      entityType: fileEntityType,
      aspect: 'children',
      scope,
    });
    return onedataGraph
      .request({
        operation: 'get',
        gri: requestGri,
        data: {
          index,
          limit,
          offset,
        },
        subscribe: false,
      })
      .then(({ children }) => allFulfilled(children.map(fileId =>
        this.getFileDataById(fileId, scope)
      )))
      .then(files => files.map(file => modelToAttrs(file)));
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

  getFileDownloadUrl(fileEntityId, scope = 'private') {
    return this.get('onedataGraph').request({
      operation: 'get',
      gri: gri({
        entityType: fileEntityType,
        entityId: fileEntityId,
        aspect: 'download_url',
        scope,
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

// FIXME: temporary for mock
function modelToAttrs(model) {
  const {
    // values
    gri,
    name,
    index,
    type,
    size,
    hasMetadata,
    mtime,
    posixPermissions,
    activePermissionsType,
    // one-to-many relations
    // NOTE: not supported in mock
    // shareList,
    // one-to-one relations
    // acl,
    parent,
    // NOTE: relation can be created from file id
    // distribution,
    owner,
    provider,
  } = model;
  return {
    guid: parseGri(gri).entityId,
    name,
    index,
    type,
    size,
    hasMetadata,
    mtime,
    posixPermissions,
    activePermissionsType,
    // one-to-many relations
    // FIXME: not supported in mock, because of async rel.
    shares: [],
    // one-to-one relations
    parentId: parseGri(parent).entityId,
    ownerId: parseGri(owner).entityId,
    providerId: provider && parseGri(provider).entityId,
  };
}

function attrsToModel(attrs, scope = 'private') {
  const {
    guid,
    name,
    index,
    type,
    size,
    hasMetadata,
    mtime,
    posixPermissions,
    activePermissionsType,
    shares,
    parentId,
    ownerId,
    providerId,
  } = attrs;
  const isPrivate = scope === 'private';
  return {
    gri: gri({
      entityType: fileEntityType,
      entityId: guid,
      aspect: 'instance',
      scope,
    }),

    revision: 0,
    name,
    index,
    type,
    size,
    hasMetadata,
    mtime,
    posixPermissions,
    activePermissionsType,

    parent: gri({
      entityType: fileEntityType,
      entityId: parentId,
      aspect: 'instance',
      scope,
    }),
    owner: gri({
      entityType: userEntityType,
      entityId: ownerId,
      aspect: 'instance',
      scope: 'shared',
    }),
    provider: isPrivate ? gri({
      entityType: providerEntityType,
      entityId: providerId,
      aspect: 'instance',
      scope: 'shared',
    }) : null,
    distribution: isPrivate ? gri({
      entityType: replicaEntityType,
      entityId: guid,
      aspect: 'distribution',
      scope: 'private',
    }) : null,
    acl: isPrivate ? gri({
      entityType: fileEntityType,
      entityId: guid,
      aspect: 'acl',
      scope: 'private',
    }) : null,
    shareList: _.isEmpty(shares) ? null : gri({
      entityType: fileEntityType,
      entityId: guid,
      aspect: shareListAspect,
    }),
  };
}
