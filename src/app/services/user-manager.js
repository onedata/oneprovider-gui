/**
 * Provides model functions related to users.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service from '@ember/service';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { inject as service } from '@ember/service';
import { getGri as spaceGri } from 'oneprovider-gui/services/space-manager';
import { entityType as userEntityType } from 'oneprovider-gui/models/user';

export default Service.extend({
  store: service(),
  onedataGraphContext: service(),

  getUserById(userId, {
    throughSpaceId,
    reload = false,
    backgroundReload = false,
    scope = 'shared',
  } = {}) {
    const userGri = gri({
      entityType: userEntityType,
      entityId: userId,
      aspect: 'instance',
      scope,
    });

    if (throughSpaceId) {
      this.onedataGraphContext.register(userGri, spaceGri(throughSpaceId));
    }

    return this.store.findRecord('user', userGri, { reload, backgroundReload });
  },
});
