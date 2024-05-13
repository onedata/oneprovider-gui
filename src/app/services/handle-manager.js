/**
 * Backend operation for handles and handle services
 *
 * @author Jakub Liput
 * @copyright (C) 2020-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { get } from '@ember/object';
import { MetadataType } from 'oneprovider-gui/models/handle';

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

  /**
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
    metadataPrefix = MetadataType.Dc,
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
    return handle;
  },
});
