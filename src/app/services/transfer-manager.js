/**
 * Provides model functions related to transfers.
 * 
 * @module services/transfer-manager
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { get, getProperties } from '@ember/object';

export default Service.extend({
  store: service(),
  onedataRpc: service(),

  /**
   * @param {string} id gri
   * @returns {Promise<Models.Transfer>}
   */
  getTransfer(id) {
    return this.get('store').findRecord('transfer', id);
  },

  /**
   * @param {Models.File} file
   * @param {string} [endedInfo='count'] one of: count, ids
   * @returns {RSVP.Promise} A backend operation completion:
   * - `resolve(object: data)` when successfully fetched the list
   *  - `data.ongoing: Array<string>` - list of non-ended transfers (waiting
   *       and outgoing) transfer IDs for the file
   *  - `data.ended: Array<string>|Number` - list of ended transfer IDs for the file,
   *       which size is limited to the value of
   *       `session.sessionDetails.config.transfersHistoryLimitPerFile`
   *        or number of ended transfers if endedInfo is "count"
   * - `reject(object: error)` on failure
   */
  getTransfersForFile(file, endedInfo = 'count') {
    return this.get('onedataRpc').request('getFileTransfers', {
      guid: get(file, 'entityId'),
      endedInfo,
    });
  },

  /**
   * @param {Models.File} file 
   * @param {Models.Oneprovider} destinationOneprovider
   * @returns {Promise<Models.Transfer>}
   */
  startReplication(file, destinationOneprovider) {
    const {
      entityId,
      type,
    } = getProperties(file, 'entityId', 'type');

    const transfer = this.get('store').createRecord('transfer', {
      dataSourceId: entityId,
      dataSourceType: type,
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
    const {
      entityId,
      type,
    } = getProperties(file, 'entityId', 'type');

    const transfer = this.get('store').createRecord('transfer', {
      dataSourceId: entityId,
      dataSourceType: type,
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
    const {
      entityId,
      type,
    } = getProperties(file, 'entityId', 'type');

    const transfer = this.get('store').createRecord('transfer', {
      dataSourceId: entityId,
      dataSourceType: type,
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
