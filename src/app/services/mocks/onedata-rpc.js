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
import { inject as service } from '@ember/service';
import { get, setProperties } from '@ember/object';
import gri from 'onedata-gui-websocket-client/utils/gri';

export default OnedataRpc.extend({
  store: service(),
  mockBackend: service(),

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

  getMockSpaceTransfers(spaceId, state) {
    return this.get('mockBackend.allTransfers')[state];
  },
});
