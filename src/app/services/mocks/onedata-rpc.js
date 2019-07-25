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
import { resolve } from 'rsvp';
import _ from 'lodash';
import { get, computed } from '@ember/object';
import {
  numberOfFiles,
  generateFileGri,
} from 'oneprovider-gui/utils/generate-development-model';

export default OnedataRpc.extend({
  childrenIdsCache: computed(() => ({})),

  __handle_getDirChildren({ guid, index, limit, offset }) {
    return resolve(this.getMockChildrenSlice(guid, index, limit, offset));
  },

  __handle_getFileDownloadUrl() {
    return resolve({
      fileUrl: '/download/test-file.txt',
    });
  },

  getMockChildrenSlice(dirEntityId, index, limit = 100000000, offset = 0) {
    const mockChildren = this.getMockChildren(dirEntityId);
    let arrIndex = _.findIndex(mockChildren, i => get(i, 'index') === index);
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
      childrenIdsCache[dirEntityId] = _.range(numberOfFiles).map(i =>
        generateFileGri(i, dirEntityId)
      );
      return childrenIdsCache[dirEntityId];
    }
  },
});
