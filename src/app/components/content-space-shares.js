/**
 * Container for signed-in user shares list for single space and file browser to use in an
 * iframe with injected properties.
 *
 * It should be displayed for single space's Shares tab. The global Shares tab for Onezone
 * is in another component - `ContentPrivateShare`.
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OneEmbeddedComponent from 'oneprovider-gui/components/one-embedded-component';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';

export default OneEmbeddedComponent.extend(
  createDataProxyMixin('share'), {
    classNames: ['content-space-shares'],
    classNameBindings: ['shareId:content-items-browser'],

    /**
     * @type {String}
     */
    spaceId: undefined,

    /**
     * @type {String}
     */
    dirId: undefined,

    /**
     * @type {String}
     */
    shareId: undefined,

    /**
     * @type {String}
     */
    providerId: undefined,

    /**
     * @override
     */
    iframeInjectedProperties: Object.freeze(['spaceId', 'shareId', 'dirId', 'tabId']),

    /**
     * @override
     */
    iframeInjectedNavigationProperties: Object.freeze(
      ['spaceId', 'shareId', 'dirId', 'tabId']
    ),

    actions: {
      getShareUrl({ shareId }) {
        return this.callParent('getShareUrl', { shareId });
      },

      /**
       * @param {Object} data
       * @param {String} data.spaceId
       * @param {String} data.dirId
       * @returns {String} Onezone URL for directory in file browser
       */
      getDataUrl({ spaceId, dirId }) {
        const providerId = this.get('guiContext.clusterId');
        return this.callParent('getDataUrl', { spaceId, dirId, providerId });
      },

      updateDirId(dirId) {
        return this.callParent('updateDirId', dirId);
      },

      onShowShareList() {
        return this.callParent('showShareList');
      },
    },
  }
);
