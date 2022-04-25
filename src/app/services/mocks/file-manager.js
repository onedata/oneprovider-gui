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
import { inject as service } from '@ember/service';
import { all as allFulfilled, Promise } from 'rsvp';
import { get } from '@ember/object';

export default ProductionFileManager.extend({
  onedataGraph: service(),

  /**
   * @override
   */
  pushChildrenAttrsToStore(childrenAttrs) {
    return allFulfilled(childrenAttrs.map(attr => this.getFileById(get(attr, 'guid'))));
  },

  getFileDownloadUrl() {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ fileUrl: '/download/test-file.zip' }), 2000);
    });
  },

  getFileApiSamples() {
    const apiSamples = [{
      apiRoot: 'https://dev-onezone.default.svc.cluster.local/api/v3/onezone',
      type: 'rest',
      swaggerOperationId: 'get_test_data',
      requiresAuthorization: false,
      placeholders: {},
      path: '/test/path/to/data',
      name: 'Get test data',
      description: 'Return test data.',
      method: 'GET',
      data: null,
      followRedirects: true,
    }, {
      type: 'xrootd',
      name: 'Test xrootd command',
      description: 'Test xrootd',
      command: ['xrdcp', '-r', 'root://root.example.com//data/test', '.'],
    }];
    return new Promise((resolve) => {
      setTimeout(() => resolve(apiSamples), 2000);
    });
  },
});
