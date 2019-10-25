/**
 * A mocked version of Onedata RPC service.
 * For properties description see non-mocked `services/onedata-rpc`
 *
 * @module services/mocks/onedata-crpc
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OnedataRpc from 'onedata-gui-websocket-client/services/mocks/onedata-rpc';
import { resolve, reject, all } from 'rsvp';
import _ from 'lodash';
import { inject as service } from '@ember/service';
import { get, setProperties, computed } from '@ember/object';
// FIXME: will be refactored
import {
  numberOfFiles,
  numberOfDirs,
  numberOfTransfers,
  generateFileEntityId,
  generateDirEntityId,
  generateFileGri,
  generateTransferGri,
  generateTransferEntityId,
  decodeTransferEntityId,
} from 'oneprovider-gui/services/mock-backend';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { computeTransferIndex } from 'oneprovider-gui/models/transfer';

export default OnedataRpc.extend({
  store: service(),

  childrenIdsCache: computed(() => ({})),
  spaceTransfersIdsCache: computed(() => ({})),

  __handle_getDirChildren({ guid, index, limit, offset }) {
    const decodedGuid = atob(guid);
    if (decodedGuid.match(/0002/)) {
      return reject({
        id: 'posix',
        details: {
          errno: 'eacces',
        },
      });
    } else if (decodedGuid.match(/0003/)) {
      return reject({
        id: 'posix',
        details: {
          errno: 'enoent',
        },
      });
    } else {
      return resolve(this.getMockChildrenSlice(guid, index, limit, offset));
    }
  },

  __handle_getFileDownloadUrl( /* { guid } */ ) {
    return resolve({
      fileUrl: '/download/test-file.txt',
    });
  },

  // TODO: mock does not change the index when changing name, so it won't work

  __handle_moveFile({ guid, targetParentGuid, targetName }) {
    return this.getFilesByEntityId([guid, targetParentGuid])
      .then(([file, newParent]) => {
        setProperties(file, {
          parent: newParent,
          name: targetName,
        });
        return file.save().then(file => ({ id: get(file, 'id') }));
      });
  },

  __handle_copyFile({ guid, targetParentGuid, targetName }) {
    const store = this.get('store');
    return this.getFilesByEntityId([guid, targetParentGuid])
      .then(([file, newParent]) => {
        setProperties(file, {
          parent: newParent,
          name: targetName,
        });
        return store
          .createRecord('file', get(file, 'data'))
          .save()
          .then(file => ({ id: get(file, 'id') }));
      });
  },

  __handle_getSpaceTransfers({ spaceId, state, index, limit, offset }) {
    return resolve(this.getMockSpaceTransfersSlice(state, index, limit, offset));
  },

  getFilesByEntityId(entityIds) {
    const store = this.get('store');
    return all(entityIds.map(eid => {
      const fileGri = gri({
        entityType: 'file',
        entityId: eid,
        aspect: 'instance',
        scope: 'private',
      });
      return store.findRecord('file', fileGri);
    }));
  },

  getMockSpaceTransfersSlice(state, index, limit = 100000000, offset = 0) {
    const mockSpaceTransfers = this.getMockSpaceTransfers(state);
    let arrIndex = mockSpaceTransfers.findBy('index', index);
    if (arrIndex === -1) {
      arrIndex = 0;
    }
    return mockSpaceTransfers.slice(arrIndex + offset, arrIndex + offset + limit);
  },

  getMockChildrenSlice(dirEntityId, index, limit = 100000000, offset = 0) {
    const mockChildren = this.getMockChildren(dirEntityId);
    let arrIndex = mockChildren.findIndex(childGri =>
      atob(parseGri(childGri).entityId) === index
    );
    if (arrIndex === -1) {
      arrIndex = 0;
    }
    return mockChildren.slice(arrIndex + offset, arrIndex + offset + limit);
  },

  getMockChildren(dirEntityId) {
    const childrenIdsCache = this.get('childrenIdsCache');
    const decodedDirEntityId = atob(dirEntityId);
    if (childrenIdsCache[dirEntityId]) {
      return childrenIdsCache[dirEntityId];
    } else {
      let cache;
      if (decodedDirEntityId === '-dir-0000') {
        // root dir
        cache = [
          ..._.range(numberOfDirs).map(i =>
            generateFileGri(generateDirEntityId(i, dirEntityId))
          ),
          ..._.range(numberOfFiles).map(i =>
            generateFileGri(generateFileEntityId(i, dirEntityId))
          ),
        ];
      } else if (/.*dir-0000.*/.test(decodedDirEntityId)) {
        const rootParentEntityId = decodedDirEntityId
          .replace(/-dir-\d+/, '')
          .replace(/-c\d+/, '');
        const parentChildNumber = decodedDirEntityId
          .match(/.*dir-0000(-c(\d+))?.*/)[2] || -1;
        const newChildNumber = String(parseInt(parentChildNumber) + 1)
          .padStart(4, '0');
        cache = [
          generateFileGri(
            generateDirEntityId(0, rootParentEntityId, `-c${newChildNumber}`)
          ),
        ];
      } else {
        cache = [];
      }
      childrenIdsCache[dirEntityId] = cache;
      return cache;
    }
  },

  getMockSpaceTransfers(state) {
    return this.get('mockBackend.allTransfers')[state];
  },

  removeMockChild(dirEntityId, childEntityId) {
    const childrenIdsCache = this.get('childrenIdsCache');
    _.remove(childrenIdsCache[dirEntityId], fileId => fileId.match(childEntityId));
  },
});
