/**
 * Transfer record wrapper for transfers table/list item 
 *
 * @module utils/transfer-table-record
 * @author Jakub Liput
 * @copyright (C) 2018 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import _ from 'lodash';
import moment from 'moment';
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';
import bytesToString from 'onedata-gui-common/utils/bytes-to-string';
import EmberObject, { computed, get, setProperties, set } from '@ember/object';

const START_END_TIME_FORMAT = 'D MMM YYYY H:mm:ss';

const statusGroups = {
  // in file tab all transfers are on the right list
  file: {
    has: () => true,
  },
  scheduled: new Set([
    'scheduled',
    'enqueued',
  ]),
  current: new Set([
    'replicating',
    'evicting',
    'cancelling',
  ]),
  completed: new Set([
    'failed',
    'cancelled',
    'skipped',
    'completed',
  ]),
};

export default EmberObject.extend({
  destinationUnknownText: 'unknown',

  /**
   * @virtual
   * @type {models/Transfer}
   */
  transfer: undefined,

  /**
   * @virtual
   * @type {ArraySlice<models/Transfer>}
   */
  transfers: undefined,

  /**
   * @virtual
   * @type {Array<models/Provider>}
   */
  providers: undefined,

  /**
   * @virtual
   * @type {object}
   */
  providersColors: undefined,

  /**
   * @virtual
   * @type {number}
   */
  updaterId: undefined,

  /**
   * @virtual
   * @type {string} one of: scheduled, current, completed
   */
  transferCollection: undefined,

  transferId: computed.reads('transfer.id'),
  viewName: computed.reads('transfer.viewName'),
  path: computed.reads('transfer.path'),
  file: computed.reads('transfer.file'),
  space: computed.reads('transfer.space'),
  dataSourceType: computed.reads('transfer.dataSourceType'),
  dataSourceIdentifier: computed.reads('transfer.dataSourceIdentifier'),
  dataSourceRecord: computed.reads('transfer.dataSourceRecord'),
  userName: computed.reads('transfer.userName'),
  scheduledAtComparable: computed.reads('transfer.scheduleTime'),
  startedAtComparable: computed.reads('transfer.startTime'),
  finishedAtComparable: computed.reads('transfer.finishTime'),
  replicatedFiles: computed.reads('transfer.replicatedFiles'),
  evictedFiles: computed.reads('transfer.evictedFiles'),
  status: computed.reads('transfer.status'),
  transferProgressError: computed.reads('transfer.transferProgressError'),
  type: computed.reads('transfer.type'),

  isLoading: computed('transfer.tableDataIsLoaded', 'isReloading', function () {
    return this.get('transfer.tableDataIsLoaded') === false || this.get(
      'isReloading');
  }),

  transferIndex: computedPipe('transferId', getHash),
  scheduledAtReadable: computedPipe('scheduledAtComparable', timeReadable),
  startedAtReadable: computedPipe('startedAtComparable', timeReadable),
  finishedAtReadable: computedPipe('finishedAtComparable', timeReadable),
  totalBytesReadable: computedPipe('transfer.replicatedBytes', bytesToString),

  listIndex: computed('transfer', 'transfers.@each.startIndex', function () {
    const transfer = this.get('transfer');
    const transfers = this.get('transfers');
    return transfers.indexOf(transfer) + get(transfers, '_start');
  }),

  /**
   * @type {ComputedProperty<String>}
   */
  destination: computed(
    'providers.@each.{entityId,name}',
    'transfer.replicatingProvider',
    function () {
      const destinationId = this.get('transfer.replicatingProvider');
      // eviction transfer
      if (!destinationId) {
        return '-';
      }
      let destination = this.get('destinationUnknownText');
      const destProvider = destination ?
        this.get('providers').findBy('entityId', destinationId) : null;
      if (destProvider) {
        destination = get(destProvider, 'name');
      }
      return destination;
    }
  ),

  isInCorrectCollection: computed('transferCollection', 'status', function () {
    const {
      transferCollection,
      status,
    } = this.getProperties('transferCollection', 'status');
    return transferCollection && status ?
      statusGroups[transferCollection].has(status) : true;
  }),

  init() {
    const transfer = this.get('transfer');
    if (get(transfer, 'isLoaded')) {
      const currentUpdaterId = this.get('updaterId');
      if (get(transfer, 'updaterId') !== currentUpdaterId) {
        setProperties(
          transfer, {
            updaterId: currentUpdaterId,
            isReloading: true,
          }
        );
        transfer.reload()
          .then(() =>
            get(transfer, 'transferProgressProxy.isPending') ?
            null : transfer.updateTransferProgressProxy()
          )
          .finally(() => set(transfer, 'isReloading', false));
      }
    } else if (get(transfer, 'isLoading')) {
      // VFS-4487 quick fix for inconsistent transfer ids
      // thus it can show some warnings/errors, but it's a temporary solution
      // TODO: remove this code when proper fix on backend will be made
      transfer.on('didLoad', () => {
        transfer.updateTransferProgressProxy();
      });
    } else {
      transfer.store.findRecord('transfer', get(transfer, 'id'))
        // VFS-4487 quick fix for inconsistent transfer ids
        // thus it can show some warnings/errors, but it's a temporary solution
        // TODO: remove this code when proper fix on backend will be made
        .then(t => t.updateCurrentStatProxy());
    }

    if (this.get('transferCollection') === 'file') {
      this.addObserver('status', function () {
        transfer.reload();
      });
      // enable observer
      this.get('status');
    }
  },
});

// https://stackoverflow.com/a/40958826
function getHash(input) {
  let hash = 0,
    len = input.length;
  for (let i = 0; i < len; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function timeReadable(timestamp) {
  return (timestamp && moment.unix(timestamp).format(START_END_TIME_FORMAT)) || '-';
}
