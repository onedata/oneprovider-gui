/**
 * Provides backend functions related to groups.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { entityType as groupEntityType } from 'oneprovider-gui/models/group';
import { getGri as spaceGri } from 'oneprovider-gui/services/space-manager';

export default Service.extend({
  store: service(),
  onedataGraphContext: service(),

  /**
   * @public
   * @param {string} groupId
   * @param {string} [fetchOptions.throughSpaceId] space ID to use in auth hint
   * @param {Boolean} [fetchOptions.reload=false]
   * @param {Boolean} [fetchOptions.backgroundReload=false]
   * @returns {Promise<Models.Group>}
   */
  async getGroupById(groupId, {
    throughSpaceId,
    reload = false,
    backgroundReload = false,
  } = {}) {
    const groupGri = gri({
      entityType: groupEntityType,
      entityId: groupId,
      aspect: 'instance',
      scope: 'shared',
    });

    if (throughSpaceId) {
      this.onedataGraphContext.register(groupGri, spaceGri(throughSpaceId));
    }

    return this.store.findRecord('group', groupGri, { reload, backgroundReload });
  },
});
