/**
 * A mocked version of file manager to bypass normalization/serialization in adapter.
 * For properties description see non-mocked `services/production/file-manager`
 *
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import ProductionFileManager from '../production/file-manager';
import { inject as service } from '@ember/service';
import { Promise } from 'rsvp';
import { get } from '@ember/object';

export default ProductionFileManager.extend({
  onedataGraph: service(),

  /**
   * @override
   */
  pushChildrenAttrsToStore({ childrenAttrs }) {
    try {
      return childrenAttrs.map(attr => {
        const fileId = get(attr, 'fileId');
        return this.getFileById(fileId);
      });
    } catch (error) {
      throw error;
    }
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
      name: 'Get test data without placeholders',
      description: 'Return test data.',
      method: 'GET',
      data: null,
      followRedirects: true,
      headers: {},
    }, {
      apiRoot: 'https://dev-onezone.default.svc.cluster.local/api/v3/onezone',
      type: 'rest',
      swaggerOperationId: 'remove_file',
      requiresAuthorization: true,
      placeholders: {},
      path: '/test/path/to/file',
      name: 'Remove file',
      description: 'Remove file.',
      method: 'DELETE',
      data: null,
      followRedirects: true,
      headers: {},
    }, {
      type: 'xrootd',
      name: 'Test xrootd command',
      description: 'Test xrootd.',
      command: ['xrdcp', '-r', 'root://root.example.com//data/test', '.'],
    }, {
      apiRoot: 'https://dev-onezone.default.svc.cluster.local/api/v3/onezone',
      type: 'rest',
      swaggerOperationId: 'update_file_content',
      requiresAuthorization: true,
      path: '/data/012738917623892469234781347107472364234/content?offset=$OFFSET',
      name: 'Update file content without optional',
      description: 'Updates the content of the file.',
      method: 'PUT',
      data: '$NEW_FILE_CONTENT',
      followRedirects: true,
      placeholders: {
        $OFFSET: 'Value of the required offset param, which does...',
        $NEW_FILE_CONTENT: 'Binary content that will be written to the file.',
      },
      optionalParameters: [],
      headers: {},
    }, {
      apiRoot: 'https://dev-onezone.default.svc.cluster.local/api/v3/onezone',
      type: 'rest',
      swaggerOperationId: 'update_file_content',
      requiresAuthorization: true,
      path: '/data/012738917623892469234781347107472364234/content',
      name: 'Update file content with optional',
      description: 'Updates the content of the file.',
      method: 'PUT',
      data: '$NEW_FILE_CONTENT',
      followRedirects: true,
      placeholders: {
        $NEW_FILE_CONTENT: 'Binary content that will be written to the file.',
      },
      optionalParameters: ['offset'],
      headers: {},
    }, {
      apiRoot: 'https://dev-onezone.default.svc.cluster.local/api/v3/onezone',
      type: 'rest',
      swaggerOperationId: 'update_privileges',
      requiresAuthorization: true,
      path: '/spaces/spaceId/users/$USER_ID/privileges',
      name: 'Update user\'s space privileges ',
      description: 'endpoint desc',
      method: 'PATCH',
      data: '{"grant": $GRANT, "revoke": $REVOKE}',
      followRedirects: true,
      placeholders: {
        $USER_ID: 'Id of the user whose privileges will be modified.',
        $GRANT: 'A list of privileges to be granted, for example: ["space_view", "space_update"]',
        $REVOKE: 'A list of privileges to be revoked.',
      },
      headers: {},
    }];
    return new Promise((resolve) => {
      setTimeout(() => resolve(apiSamples), 1);
    });
  },
});
