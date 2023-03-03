/**
 * Provides model functions related to providers.
 *
 * @author Jakub Liput, Michał Borzęcki
 * @copyright (C) 2019-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service from '@ember/service';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { inject as service } from '@ember/service';
import { entityType as providerEntityType } from 'oneprovider-gui/models/provider';
import { getGri as spaceGri } from 'oneprovider-gui/services/space-manager';

export default Service.extend({
  store: service(),
  onedataGraphContext: service(),
  guiContext: service(),

  /**
   * @param {string} providerId
   * @param {string} [fetchOptions.throughSpaceId] space ID to use in auth hint
   * @param {Boolean} [fetchOptions.reload=false]
   * @param {Boolean} [fetchOptions.backgroundReload=false]
   * @returns {Promise<Models.Provider>}
   */
  getProviderById(providerId, {
    throughSpaceId,
    reload = false,
    backgroundReload = false,
  } = {}) {
    const {
      store,
      onedataGraphContext,
    } = this.getProperties('store', 'onedataGraphContext');

    const providerGri = gri({
      entityType: providerEntityType,
      entityId: providerId,
      aspect: 'instance',
      scope: 'protected',
    });

    if (throughSpaceId) {
      onedataGraphContext.register(providerGri, spaceGri(throughSpaceId));
    }

    return store.findRecord('provider', providerGri, { reload, backgroundReload });
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
