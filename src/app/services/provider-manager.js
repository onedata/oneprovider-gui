/**
 * Provides model functions related to providers.
 *
 * @module services/provider-manager
 * @author Jakub Liput, Michał Borzęcki
 * @copyright (C) 2019-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service from '@ember/service';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { inject as service } from '@ember/service';
import { entityType as providerEntityType } from 'oneprovider-gui/models/provider';
import { spaceGri } from 'oneprovider-gui/services/space-manager';

export default Service.extend({
  store: service(),

  /**
   * @param {string} providerId
   * @param {string} [fetchOptions.throughSpaceId]
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
});
