/**
 * Provides model functions related to providers.
 * 
 * @module services/provider-manager
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service from '@ember/service';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { inject as service } from '@ember/service';
import { entityType as providerEntityType } from 'oneprovider-gui/models/provider';

export default Service.extend({
  store: service(),
  guiContext: service(),

  /**
   * @param {String} providerId 
   * @returns {Promise<Models.Provider>}
   */
  getProviderById(providerId) {
    const providerGri = gri({
      entityType: providerEntityType,
      entityId: providerId,
      aspect: 'instance',
      scope: 'protected',
    });
    return this.get('store').findRecord('provider', providerGri);
  },

  /**
   * @returns {string}
   */
  getCurrentProviderId() {
    return this.get('guiContext.clusterId');
  },

  /**
   * @returns {Promise<Models.Provider>}
   */
  getCurrentProvider() {
    return this.getProviderById(this.getCurrentProviderId());
  },
});
