/**
 * Provides model functions related to transfers.
 * 
 * @module services/transfer-manager
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { get } from '@ember/object';

export default Service.extend({
  store: service(),

  /**
   * @param {Models.File} file 
   * @param {Models.Oneprovider} destinationOneprovider
   * @returns {Promise<Models.Transfer>}
   */
  startReplication(file, destinationOneprovider) {
    const transfer = this.get('store').createRecord('transfer', {
      dataSourceIdentifier: get(file, 'entityId'),
      replicatingProvider: destinationOneprovider,
    });
    return deleteRecordIfFailed(transfer, transfer.save());
  },

  /**
   * @param {Models.File} file 
   * @param {Models.Oneprovider} sourceOneprovider
   * @param {Models.Oneprovider} destinationOneprovider
   * @returns {Promise<Models.Transfer>}
   */
  startMigration(file, sourceOneprovider, destinationOneprovider) {
    const transfer = this.get('store').createRecord('transfer', {
      dataSourceIdentifier: get(file, 'entityId'),
      evictingProvider: sourceOneprovider,
      replicatingProvider: destinationOneprovider,
    });
    return deleteRecordIfFailed(transfer, transfer.save());
  },

  /**
   * @param {Models.File} file 
   * @param {Models.Oneprovider} sourceOneprovider
   * @returns {Promise<Models.Transfer>}
   */
  startEviction(file, sourceOneprovider) {
    const transfer = this.get('store').createRecord('transfer', {
      dataSourceIdentifier: get(file, 'entityId'),
        evictingProvider: sourceOneprovider,
    });
    return deleteRecordIfFailed(transfer, transfer.save());
  },
});

/**
 * @param {DS.Model} record 
 * @param {Promise} promise 
 * @returns {Promise} the same as `promise` arguments
 */
function deleteRecordIfFailed(record, promise) {
  promise.catch(() => record.deleteRecord());
  return promise;
}
