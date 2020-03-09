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
import gri from 'onedata-gui-websocket-client/utils/gri';
import { all as allFulfilled, resolve } from 'rsvp';
import { entityType as transferEntityType } from 'oneprovider-gui/models/transfer';

export const replicaEntityType = 'op_replica';

export function replicaGri(fileId) {
  return gri({
    entityType: replicaEntityType,
    entityId: fileId,
    aspect: 'instance',
  });
}

export default Service.extend({
  store: service(),
  onedataGraph: service(),
  onedataRpc: service(),

  /**
   * @param {string} entityId entityId of transfer
   * @returns {Promise<Models.Transfer>}
   */
  getTransferById(entityId) {
    const transferGri = gri({
      entityType: transferEntityType,
      entityId,
      aspect: 'instance',
      scope: 'private',
    });
    return this.get('store').findRecord('transfer', transferGri);
  },

  /**
   * @param {Models.File} file
   * @param {boolean} [includeEndedIds=false]
   * @returns {RSVP.Promise} A backend operation completion:
   * - `resolve(object: data)` when successfully fetched the list
   *  - `data.ongoingIds: Array<Models.Transfer>` - list of non-ended transfers (waiting
   *       and outgoing) for the file
   *  - `data.endedCount` Math.min(number of ended transfers, transfersHistoryLimitPerFile)
   *  - `data.endedIds` (optional, exists if includeEndedIds was true) list of ended
   *       transfers for the file, which size is limited to the value of
   *       transfersHistoryLimitPerFile
   * - `reject(object: error)` on failure
   */
  getTransfersForFile(file, includeEndedIds = false) {
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
          include_ended_ids: includeEndedIds,
        },
        subscribe: false,
      })
      .then(({ ongoingIds, endedCount, endedIds }) => {
        const ongoingTransfersFetch =
          allFulfilled(ongoingIds.map(tid => this.getTransferById(tid)));
        const endedTransfersFetch = includeEndedIds ?
          allFulfilled(endedIds.map(tid => this.getTransferById(tid))) : resolve();
        return allFulfilled([ongoingTransfersFetch, endedTransfersFetch])
          .then(([ongoingTransfers, endedTransfers]) => ({
            ongoingTransfers,
            endedTransfers,
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
    const {
      store,
      onedataGraph,
    } = this.getProperties('store', 'onedataGraph');
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
    return onedataGraph
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
   * @returns {Promise<TransferThroughputCharts>}
   */
  getThroughputCharts(transfer, timePeriod) {
    const {
      entityType,
      entityId,
    } = getProperties(transfer, 'entityType', 'entityId');
    const chartsGri = gri({
      entityType: entityType,
      entityId: entityId,
      aspect: 'throughput_charts',
    });
    return this.get('onedataGraph').request({
      gri: chartsGri,
      operation: 'get',
      data: {
        charts_type: timePeriod,
      },
      subscribe: false,
    });
  },

  /**
   * @param {Models.Space} space
   * @param {string} transferType one of: job, onTheFly, all
   * @param {string} timePeriod one of: minute, hour, day, month
   * @param {string|undefined} providerId provider entityId
   * @returns {Promise<TransferThroughputCharts>}
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
      data: {
        transfer_type: transferType,
        charts_type: timePeriod,
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
   * @returns {Promise<Object>} with property `channelDestinations` which maps:
   *   `sourceProviderId -> [destinationProviderId, ...]`
   */
  getSpaceTransfersActiveChannels(space) {
    const {
      entityType,
      entityId,
    } = getProperties(space, 'entityType', 'entityId');
    const activeChannelsGri = gri({
      entityType: entityType,
      entityId: entityId,
      aspect: 'transfers_active_channels',
    });
    return this.get('onedataGraph').request({
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
    const fileId = get(file, 'entityId');
    const destinationOneproviderId = get(destinationOneprovider, 'entityId');

    return this.get('onedataGraph').request({
        operation: 'create',
        gri: replicaGri(fileId),
        data: {
          provider_id: destinationOneproviderId,
        },
        subscribe: false,
      })
      .then(({ transferId }) => this.getTransferById(transferId));
  },

  /**
   * @param {Models.File} file 
   * @param {Models.Provider} sourceOneprovider
   * @param {Models.Provider} destinationOneprovider
   * @returns {Promise<Models.Transfer>}
   */
  startMigration(file, sourceOneprovider, destinationOneprovider) {
    const fileId = get(file, 'entityId');
    const sourceOneproviderId = get(sourceOneprovider, 'entityId');
    const destinationOneproviderId = get(destinationOneprovider, 'entityId');

    return this.get('onedataGraph').request({
        operation: 'delete',
        gri: replicaGri(fileId),
        data: {
          provider_id: sourceOneproviderId,
          migration_provider_id: destinationOneproviderId,
        },
        subscribe: false,
      })
      .then(({ transferId }) => this.getTransferById(transferId));
  },

  /**
   * @param {Models.File} file 
   * @param {Models.Provider} sourceOneprovider
   * @returns {Promise<Models.Transfer>}
   */
  startEviction(file, sourceOneprovider) {
    const fileId = get(file, 'entityId');
    const sourceOneproviderId = get(sourceOneprovider, 'entityId');

    return this.get('onedataGraph').request({
        operation: 'delete',
        gri: replicaGri(fileId),
        data: {
          provider_id: sourceOneproviderId,
        },
        subscribe: false,
      })
      .then(({ transferId }) => this.getTransferById(transferId));
  },

  rerunTransfer(transfer) {
    const {
      entityType,
      entityId,
    } = getProperties(transfer, 'entityType', 'entityId');
    const requestGri = gri({
      entityType,
      entityId,
      aspect: 'rerun',
    });
    return this.get('onedataGraph').request({
      gri: requestGri,
      operation: 'create',
      subscribe: false,
    });
  },

  cancelTransfer(transfer) {
    const {
      entityType,
      entityId,
    } = getProperties(transfer, 'entityType', 'entityId');
    const requestGri = gri({
      entityType,
      entityId,
      aspect: 'cancel',
    });
    return this.get('onedataGraph').request({
      gri: requestGri,
      operation: 'delete',
      subscribe: false,
    });
  },
});
