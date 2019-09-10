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
import { resolve, all } from 'rsvp';
import _ from 'lodash';
import { inject as service } from '@ember/service';
import { get, setProperties, computed } from '@ember/object';
import {
  numberOfFiles,
  numberOfDirs,
  generateFileEntityId,
  generateDirEntityId,
  generateFileGri,
} from 'oneprovider-gui/utils/generate-development-model';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import gri from 'onedata-gui-websocket-client/utils/gri';

export default OnedataRpc.extend({
  store: service(),

  childrenIdsCache: computed(() => ({})),

  __handle_getDirChildren({ guid, index, limit, offset }) {
    return resolve(this.getMockChildrenSlice(guid, index, limit, offset));
  },

  __handle_getFileDownloadUrl( /* { guid } */ ) {
    return resolve({
      fileUrl: '/download/test-file.txt',
    });
  },

  // FIXME: mock does not change the index when changing name, so it won't work

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

  getMockChildrenSlice(dirEntityId, index, limit = 100000000, offset = 0) {
    const mockChildren = this.getMockChildren(dirEntityId);
    let arrIndex = mockChildren.findIndex(childGri =>
      parseGri(childGri).entityId === index
    );
    if (arrIndex === -1) {
      arrIndex = 0;
    }
    return mockChildren.slice(arrIndex + offset, arrIndex + offset + limit);
  },

  getMockChildren(dirEntityId) {
    const childrenIdsCache = this.get('childrenIdsCache');
    if (childrenIdsCache[dirEntityId]) {
      return childrenIdsCache[dirEntityId];
    } else {
      let cache;
      if (dirEntityId.length === 8) {
        cache = [
          ..._.range(numberOfDirs).map(i =>
            generateFileGri(generateDirEntityId(i, dirEntityId))
          ),
          ..._.range(numberOfFiles).map(i =>
            generateFileGri(generateFileEntityId(i, dirEntityId))
          ),
        ];
      } else if (/.*dir-0000.*/.test(dirEntityId)) {
        const rootParentEntityId = dirEntityId
          .replace(/-dir-\d+/, '')
          .replace(/-c\d+/, '');
        const parentChildNumber = dirEntityId.match(/.*dir-0000(-c(\d+))?.*/)[2] || -1;
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

  removeMockChild(dirEntityId, childEntityId) {
    const childrenIdsCache = this.get('childrenIdsCache');
    _.remove(childrenIdsCache[dirEntityId], fileId => fileId.match(childEntityId));
  },
});
