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
import { all as allFulfilled, resolve } from 'rsvp';

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
   *  - `data.ongoingList: Array<Models.Transfer>` - list of non-ended transfers (waiting
   *       and outgoing) for the file
   *  - `data.endedCount` Math.min(number of ended transfers, transfersHistoryLimitPerFile)
   *  - `data.endedList` (optional, exists if includeEndedList was true) list of ended
   *       transfers for the file, which size is limited to the value of
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
      })
      .then(({ ongoingList, endedCount, endedList }) => {
        const ongoingTransfersFetch =
          allFulfilled(ongoingList.map(tid => this.getTransfer(tid)));
        const endedTransfersFetch = includeEndedList ?
          allFulfilled(endedList.map(tid => this.getTransfer(tid))) : resolve();
        return allFulfilled([ongoingTransfersFetch, endedTransfersFetch])
          .then(([ongoingTransfers, endedTransfers]) => ({
            ongoingList: ongoingTransfers,
            endedList: endedTransfers,
            endedCount,
          }));
      });
  },

  /**
   * @param {Models.Space} space 
   * @param {string} state one of: waiting, ongoing, ended
   * @param {string} startFromIndex 
   * @param {number} limit 
   * @param {number} offset 
   * @returns {Promise<Object>}
   */
  getTransfersForSpace(space, state, startFromIndex, limit, offset) {
    const {
      entityType,
      entityId,
      store,
    } = getProperties(space, 'entityType', 'entityId', 'store');
    const transfersGri = gri({
      entityType,
      entityId,
      aspect: 'transfers',
    });
    return this.get('onedataGraph').request({
        gri: transfersGri,
        operation: 'get',
        data: {
          state,
          offset,
          limit,
          page_token: startFromIndex,
        },
        subscribe: false,
      })
      .then(({ list }) =>
        allFulfilled(list.map(tid => store.findRecord('transfer', tid)))
      );
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

  // FIXME: pass only fileEntityId
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
