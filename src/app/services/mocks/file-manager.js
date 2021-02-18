/**
 * A mocked version of file manager to bypass normalization/serialization in adapter.
 * For properties description see non-mocked `services/production/file-manager`
 *
 * @module services/mocks/file-manager
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import ProductionFileManager from '../production/file-manager';
import { resolve } from 'rsvp';
import { inject as service } from '@ember/service';
import { all as allFulfilled, Promise } from 'rsvp';
import { get } from '@ember/object';

export default ProductionFileManager.extend({
  onedataGraph: service(),

  /**
   * @override
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
        return allFulfilled(children.map(attr => this.getFileById(get(attr, 'guid'))))
          .then(childrenRecords => ({ childrenRecords, isLast }));
      });
    }
  },

  getFileDownloadUrl() {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ fileUrl: '/download/test-file.zip' }), 2000);
    });
  },
});
