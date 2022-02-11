/**
 * Provides model functions related to storages.
 *
 * @module services/storage-manager
 * @author Michał Borzęcki
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service from '@ember/service';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { inject as service } from '@ember/service';
import { entityType as storageEntityType } from 'oneprovider-gui/models/storage';
import { spaceGri } from 'oneprovider-gui/services/space-manager';

export default Service.extend({
  store: service(),
  onedataGraphContext: service(),

  /**
   * @public
   * @param {string} storageId
   * @param {string} [throughSpaceId]
   * @returns {Promise<Models.Storage>}
   */
  getStorageById(storageId, throughSpaceId) {
    const {
      store,
      onedataGraphContext,
    } = this.getProperties('store', 'onedataGraphContext');

    const storageGri = gri({
      entityType: storageEntityType,
      entityId: storageId,
      aspect: 'instance',
      scope: 'shared',
    });

    if (throughSpaceId) {
      onedataGraphContext.register(storageGri, spaceGri(throughSpaceId));
    }

    return store.findRecord('storage', storageGri);
  },
});
