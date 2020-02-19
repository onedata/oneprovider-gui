/**
 * Container for private share file browser to use in an iframe with injected properties.
 * 
 * @module component/content-private-share
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { inject as service } from '@ember/service';
import ContentPublicShare from 'oneprovider-gui/components/content-public-share';
import layout from 'oneprovider-gui/templates/components/content-public-share';

export default ContentPublicShare.extend({
  layout,
  guiContext: service(),

  /**
   * @override
   */
  scope: 'private',

  actions: {
    getDataUrl({ dirId }) {
      const providerId = this.get('guiContext.clusterId');
      const spaceId = this.get('spaceId');
      return this.callParent('getDataUrl', { spaceId, dirId, providerId });
    },
    showShareList() {
      return this.callParent('showSharesIndex');
    },
    reloadShareList() {
      return this.callParent('reloadShareList');
    },
  },
});
