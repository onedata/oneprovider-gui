/**
 * Provides model functions related to transfers.
 * 
 * @module services/transfer-manager
 * @author Michał Borzęcki
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { getProperties } from '@ember/object';
import gri from 'onedata-gui-websocket-client/utils/gri';

export default Service.extend({
  store: service(),
  onedataGraph: service(),
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
   * @param {boolean} [includeEndedList=false]
   * @returns {RSVP.Promise} A backend operation completion:
   * - `resolve(object: data)` when successfully fetched the list
   *  - `data.ongoingList: Array<string>` - list of non-ended transfers (waiting
   *       and outgoing) transfer IDs for the file
   *  - `data.endedCount` Math.min(number of ended transfers, transfersHistoryLimitPerFile)
   *  - `data.endedList` (optional, exists if includeEndedList was true) list of ended
   *       transfer IDs for the file, which size is limited to the value of
   *       transfersHistoryLimitPerFile
   * - `reject(object: error)` on failure
   */
  getTransfersForFile(file, includeEndedList = false) {
    const {
      entityType,
      entityId,
    } = getProperties(file, 'entityType', 'entityId');
    const transferGri = gri({
      entityType,
      entityId,
      aspect: 'transfers',
    });
    return this.get('onedataGraph').request({
      gri: transferGri,
      operation: 'get',
      data: {
        include_ended_list: includeEndedList,
      },
      subscribe: false,
    });
  },

  /**
   * @param {Models.File} file 
   * @param {Models.Provider} destinationOneprovider
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
   * @param {Models.Provider} sourceOneprovider
   * @param {Models.Provider} destinationOneprovider
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
   * @param {Models.Provider} sourceOneprovider
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
