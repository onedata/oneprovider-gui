/**
 * Backend operation for handles and handle services
 *
 * @author Jakub Liput
 * @copyright (C) 2020-2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { get, set } from '@ember/object';

export default Service.extend({
  store: service(),
  currentUser: service(),

  getHandleServices() {
    return this.get('currentUser').getCurrentUserRecord()
      .then(user => user.getRelation('effHandleServiceList', { reload: true }))
      .then(effHandleServiceList => get(effHandleServiceList, 'list'));
  },

  /**
   *
   * @param {Object} options
   * @param {Models.Share} options.share
   * @param {string} options.handleServiceId
   * @param {string} options.metadataString
   * @param {HandleModel.MetadataType} options.metadataPrefix
   * @returns {Models.Handle}
   */
  async createHandle({
    share,
    handleServiceId,
    metadataString,
    metadataPrefix = 'oai_dc',
  } = {}) {
    const handle = this.store.createRecord('handle', {
      metadataPrefix,
      metadataString,
      _meta: {
        additionalData: {
          shareId: get(share, 'entityId'),
          handleServiceId,
        },
      },
    });
    await handle.save();
    await share.reload();
    if (!get(share, 'handle.content')) {
      set(share, 'handle', handle);
      await share.save();
    }
    return handle;
  },
});
