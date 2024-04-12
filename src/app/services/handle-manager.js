/**
 * Backend operation for handles and handle services
 *
 * @author Jakub Liput
 * @copyright (C) 2020-2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { get, set } from '@ember/object';

export default Service.extend({
  store: service(),
  currentUser: service(),

  /**
   * @returns {Promise<number>}
   */
  async getHandleServiceCount() {
    const user = await this.currentUser.getCurrentUserRecord();
    const handleServiceList = await user.getRelation('effHandleServiceList');
    return get(handleServiceList, 'list').length;
  },

  getHandleServices() {
    return this.get('currentUser').getCurrentUserRecord()
      .then(user => user.getRelation('effHandleServiceList', { reload: true }))
      .then(effHandleServiceList => get(effHandleServiceList, 'list'));
  },

  createHandle(share, handleServiceId, metadataString) {
    const handle = this.get('store').createRecord('handle', {
      metadataString,
      _meta: {
        additionalData: {
          shareId: get(share, 'entityId'),
          handleServiceId,
        },
      },
    });
    return handle.save()
      .then(() => share.reload())
      .then(() => {
        if (!get(share, 'handle.content')) {
          set(share, 'handle', handle);
          return share.save().then(() => handle);
        } else {
          return handle;
        }
      });
  },
});
