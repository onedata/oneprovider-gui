/**
 * Container for private share file browser to use in an iframe with injected properties.
 *
 * It should be displayed for global Onezone's Shares tab. The Shares sub-tab for single
 * space is in another component - `ContentSpaceShares`.
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { inject as service } from '@ember/service';
import ContentPublicShare from 'oneprovider-gui/components/content-public-share';
import { computed, get } from '@ember/object';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { all as allFulfilled } from 'rsvp';

export default ContentPublicShare.extend({
  guiContext: service(),
  spaceManager: service(),

  /**
   * @override
   */
  scope: 'private',

  spaceProxy: computed('shareProxy.content.spaceId', function spaceProxy() {
    const promise = (async () => {
      const spaceId = get(await this.shareProxy, 'spaceId');
      return await this.spaceManager.getSpace(spaceId);
    })();
    return promiseObject(promise);
  }),

  requiredDataProxy: computed('spaceProxy', 'shareProxy', function requiredDataProxy() {
    return allFulfilled([this.spaceProxy, this.shareProxy]);
  }),

  actions: {
    getDataUrl({ dirId }) {
      const providerId = this.get('guiContext.clusterId');
      const spaceId = this.get('spaceId');
      return this.callParent('getDataUrl', { spaceId, dirId, providerId });
    },
    onShowShareList() {
      return this.callParent('showSharesIndex');
    },
    reloadShareList() {
      return this.callParent('reloadShareList');
    },
  },
});
