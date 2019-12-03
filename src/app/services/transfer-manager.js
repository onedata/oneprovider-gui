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
   * @returns {Promise<Array<Models.Transfer>>}
   */
  getTransfersForSpace(space, state, startFromIndex, limit, offset) {
    const store = this.get('store');
    const {
      entityType,
      entityId,
    } = getProperties(space, 'entityType', 'entityId');
    const transfersGri = gri({
      entityType,
      entityId,
      aspect: 'transfers',
    });
    if (limit <= 0) {
      return resolve([]);
    }
    return this.get('onedataGraph')
      .request({
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
   * @param {Models.Transfer} transfer
   * @param {string} timePeriod: one of: minute, hour, day, month
   * @returns {Promise<Object>}  with fields: charts: Object, timestamp: Number
   */
  getThroughputCharts(transfer, timePeriod) {
    const {
      onedataGraph,
    } = this.getProperties('onedataGraph');
    const {
      entityType,
      entityId,
    } = getProperties(transfer, 'entityType', 'entityId');
    const chartsGri = gri({
      entityType: entityType,
      entityId: entityId,
      aspect: 'throughput_charts',
    });
    return onedataGraph.request({
      gri: chartsGri,
      operation: 'get',
      // FIXME: to refactor to charts_type
      data: {
        chartsType: timePeriod,
      },
      subscribe: false,
    });
  },

  /**
   * @param {Models.Space} space
   * @param {string} transferType one of: job, onTheFly, all
   * @param {string} timePeriod one of: minute, hour, day, month
   * @param {string|undefined} providerId provider entityId
   * @returns {Promise<Object>} with fields: inputCharts: Object, 
   *  outputCharts: Object, timestamp: Number
   */
  getSpaceTransfersThroughputCharts(space, transferType, timePeriod, providerId) {
    const onedataGraph = this.get('onedataGraph');
    const {
      entityType,
      entityId,
    } = getProperties(space, 'entityType', 'entityId');
    const chartsGri = gri({
      entityType: entityType,
      entityId: entityId,
      aspect: 'transfers_throughput_charts',
      aspectId: providerId || 'undefined',
    });
    return onedataGraph.request({
      gri: chartsGri,
      operation: 'get',
      // FIXME: to refactor to transfer_type and charts_type
      data: {
        transferType,
        chartsType: timePeriod,
      },
      subscribe: false,
    });
  },

  getTransferProgress(transfer) {
    const onedataGraph = this.get('onedataGraph');
    const {
      entityType,
      entityId,
    } = transfer.getProperties('entityType', 'entityId');
    const transferProgressGri = gri({
      entityType,
      entityId,
      aspect: 'progress',
      scope: 'private',
    });
    return onedataGraph.request({
      gri: transferProgressGri,
      operation: 'get',
      subscribe: false,
    });
  },

  /**
   * @param {Models.Space} space
   * @returns {Promise<Object>} with property `channelDestinaions` which maps:
   *   `sourceProviderId -> [destinationProviderId, ...]`
   */
  getSpaceTransfersActiveChannels(space) {
    const {
      onedataGraph,
    } = this.getProperties('onedataGraph');
    const {
      entityType,
      entityId,
    } = getProperties(space, 'entityType', 'entityId');
    const activeChannelsGri = gri({
      entityType: entityType,
      entityId: entityId,
      aspect: 'transfers_active_channels',
    });
    return onedataGraph.request({
      gri: activeChannelsGri,
      operation: 'get',
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

  rerunTransfer(transfer) {
    const {
      entityType,
      entityId,
    } = getProperties(transfer, 'entityType', 'entityId');
    const rerunGri = gri({
      entityType,
      entityId,
      aspect: 'rerun',
    });
    this.get('onedataGraph').request({
      gri: rerunGri,
      operation: 'create',
      subscribe: false,
    });
  },

  cancelTransfer(transfer) {
    const {
      entityType,
      entityId,
    } = getProperties(transfer, 'entityType', 'entityId');
    const rerunGri = gri({
      entityType,
      entityId,
      aspect: 'instance',
    });
    this.get('onedataGraph').request({
      gri: rerunGri,
      operation: 'delete',
      subscribe: false,
    });
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
