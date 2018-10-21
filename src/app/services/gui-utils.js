/**
 * Provides data and implementation of utils specific for oneprovider-gui
 *
 * @module services/gui-utils
 * @author Michal Borzecki, Jakub Liput
 * @copyright (C) 2018 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import GuiUtils from 'onedata-gui-common/services/gui-utils';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import modelRoutableId from 'oneprovider-gui/utils/model-routable-id';
import UserProxyMixin from 'onedata-gui-websocket-client/mixins/user-proxy';

export default GuiUtils.extend(UserProxyMixin, {
  onedataConnection: service(),

  currentUser: service(),

  /**
   * @override
   */
  guiType: computed(function () {
    return this.t('oneprovider');
  }),

  /**
   * @override
   */
  guiName: computed(function () {
    return this.get('onedataConnection.providerName');
  }),

  /**
   * @override
   */
  guiVersion: reads('onedataConnection.serviceVersion'),

  /**
   * @override
   */
  guiIcon: 'assets/images/oneprovider-logo.svg',

  /**
   * @override
   * @param {object|string} record
   * @returns {string}
   */
  getRoutableIdFor(record) {
    return modelRoutableId(record);
  },
});
