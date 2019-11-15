/**
 * Transfer record wrapper for transfers table/list item 
 *
 * @module utils/transfer-table-record
 * @author Jakub Liput
 * @copyright (C) 2018 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import moment from 'moment';
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';
import bytesToString from 'onedata-gui-common/utils/bytes-to-string';
import EmberObject, {
  computed,
  get,
  setProperties,
  getProperties,
  set,
} from '@ember/object';
import { reads } from '@ember/object/computed';
import { promise } from 'ember-awesome-macros';

const startEndTimeFormat = 'D MMM YYYY H:mm:ss';

const statusGroups = {
  // in file tab all transfers are on the right list
  file: {
    has: () => true,
  },
  scheduled: new Set([
    'scheduled',
    'enqueued',
  ]),
  ongoing: new Set([
    'replicating',
    'evicting',
    'cancelling',
  ]),
  ended: new Set([
    'failed',
    'cancelled',
    'skipped',
    'completed',
  ]),
};

// FIXME: check if all fields are needed and refactor

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
   * @type {number}
   */
  updaterId: undefined,

  /**
   * @virtual
   * @type {string} one of: scheduled, ongoing, ended
   */
  transferCollection: undefined,

  /**
   * @virtual
   * @type {String}
   */
  spaceId: undefined,

  transferId: reads('transfer.entityId'),

  file: reads('transfer.file'),
  dataSourceType: reads('transfer.dataSourceType'),
  dataSourceName: reads('transfer.dataSourceName'),
  dataSourceId: reads('transfer.dataSourceId'),
  dataSourceRecord: reads('transfer.dataSourceRecord'),
  userName: reads('userNameProxy.content.name'),
  scheduledAtComparable: reads('transfer.scheduleTime'),
  startedAtComparable: reads('transfer.startTime'),
  finishedAtComparable: reads('transfer.finishTime'),
  replicatedFiles: reads('transfer.transferProgressProxy.replicatedFiles'),
  evictedFiles: reads('transfer.transferProgressProxy.evictedFiles'),
  status: reads('transfer.transferProgressProxy.status'),
  transferProgressError: reads('transfer.transferProgressProxy.reason'),
  type: reads('transfer.type'),

  isLoading: computed('transfer.tableDataIsLoaded', 'isReloading', function () {
    return this.get('transfer.tableDataIsLoaded') === false || this.get(
      'isReloading');
  }),

  userNameProxy: promise.object(computed('spaceId', function userNameProxy() {
    const {
      transfer,
      spaceId,
    } = this.getProperties('transfer', 'spaceId');
    return transfer.fetchUser(spaceId);
  })),

  transferIndex: computedPipe('transferId', getHash),
  scheduledAtReadable: computedPipe('scheduledAtComparable', timeReadable),
  startedAtReadable: computedPipe('startedAtComparable', timeReadable),
  finishedAtReadable: computedPipe('finishedAtComparable', timeReadable),
  totalBytesReadable: computedPipe(
    'transfer.transferProgressProxy.replicatedBytes',
    bytesToString
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  destination: computed(
    'providers.@each.{entityId,name}',
    'transfer.replicatingProvider',
    function _destination() {
      const destinationId = this.get('transfer.replicatingProvider.entityId');
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

  isInCorrectCollection: computed(
    'transferCollection',
    'status',
    function isInCorrectCollection() {
      const {
        transferCollection,
        status,
      } = this.getProperties('transferCollection', 'status');
      return transferCollection && status ?
        statusGroups[transferCollection].has(status) : true;
    }
  ),

  init() {
    const {
      transfer,
      updaterId,
    } = this.getProperties('transfer', 'updaterId');
    console.log('>>>', get(transfer, 'id'));
    const {
      id: transferGri,
      isLoaded,
      isLoading,
      updaterId: transferUpdaterId,
      store,
    } = getProperties(transfer, 'id', 'isLoaded', 'isLoading', 'store');
    if (isLoaded) {
      if (transferUpdaterId !== updaterId) {
        setProperties(
          transfer, {
            updaterId,
            isReloading: true,
          }
        );
        transfer.reload()
          .then(() =>
            get(transfer, 'transferProgressProxy.isPending') ?
            null : transfer.updateTransferProgressProxy({ replace: true })
          )
          .finally(() => set(transfer, 'isReloading', false));
      }
    } else if (isLoading) {
      // VFS-4487 quick fix for inconsistent transfer ids
      // thus it can show some warnings/errors, but it's a temporary solution
      // TODO: remove this code when proper fix on backend will be made
      transfer.on('didLoad', () => {
        transfer.updateTransferProgressProxy({ replace: true });
      });
    } else if (store) {
      store.findRecord('transfer', transferGri)
        // VFS-4487 quick fix for inconsistent transfer ids
        // thus it can show some warnings/errors, but it's a temporary solution
        // TODO: remove this code when proper fix on backend will be made
        .then(t => t.updateTransferProgressProxy({ replace: true }));
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
  return (timestamp && moment.unix(timestamp).format(startEndTimeFormat)) || '-';
}
