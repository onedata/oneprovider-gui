/**
 * Provides utils for generating XRootD commands for various operations in Onedata.
 *
 * @module services/xrootd-api-generator
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import ApiStringGenerator from 'oneprovider-gui/services/api-string-generator';
import { get } from '@ember/object';
import { bool } from 'ember-awesome-macros';

export default ApiStringGenerator.extend({
  /**
   * @override
   */
  apiType: 'xrootd',

  hasXrootdTemplates: bool('onedataConnection.apiTemplates.xrootd'),

  isAvailableFor({ share }) {
    return this.get('hasXrootdTemplates') && get(share, 'hasHandle');
  },

  downloadSharedFileContent({ spaceId, shareId, path }) {
    return this.fillTemplate('downloadSharedFileContent', {
      spaceId,
      shareId,
      path,
    });
  },

  downloadSharedDirectoryContent({ spaceId, shareId, path }) {
    return this.fillTemplate('downloadSharedDirectoryContent', {
      spaceId,
      shareId,
      path,
    });
  },

  listSharedDirectoryChildren({ spaceId, shareId, path }) {
    return this.fillTemplate('listSharedDirectoryChildren', {
      spaceId,
      shareId,
      path,
    });
  },
});
