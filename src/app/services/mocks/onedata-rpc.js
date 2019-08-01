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
import { computed } from '@ember/object';
import {
  numberOfFiles,
  numberOfDirs,
  generateFileEntityId,
  generateDirEntityId,
  generateFileGri,
} from 'oneprovider-gui/utils/generate-development-model';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';

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
      childrenIdsCache[dirEntityId] = [
        ..._.range(numberOfDirs).map(i =>
          generateFileGri(generateDirEntityId(i, dirEntityId))
        ),
        ..._.range(numberOfFiles).map(i =>
          generateFileGri(generateFileEntityId(i, dirEntityId))
        ),
      ];
      return childrenIdsCache[dirEntityId];
    }
  },
});
