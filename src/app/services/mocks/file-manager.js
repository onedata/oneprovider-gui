/**
 * A mocked version of file manager to bypass normalization/serialization in adapter.
 * For properties description see non-mocked `services/production/file-manager`
 *
 * @module services/mocks/file-manager
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import ProductionFileManager from '../production/file-manager';
import { resolve } from 'rsvp';
import { inject as service } from '@ember/service';
import { all as allFulfilled } from 'rsvp';

export default ProductionFileManager.extend({
  onedataGraph: service(),

  /**
   * @override
   */
  fetchDirChildren(dirId, scope, index, limit, offset) {
    if (!limit || limit <= 0) {
      return resolve([]);
    } else {
      return allFulfilled(this.get('onedataGraph').getMockChildrenSlice({
        type: 'id',
        dirId,
        index,
        limit,
        offset,
      }).map(fileId => this.getFileById(fileId)));
    }
  },
});
