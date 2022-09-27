/**
 * Transfer record wrapper for transfers table/list item
 *
 * @module utils/transfer-table-record
 * @author Jakub Liput
 * @copyright (C) 2018-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import moment from 'moment';
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';
import bytesToString from 'onedata-gui-common/utils/bytes-to-string';
import EmberObject, {
  computed,
  observer,
  get,
  getProperties,
} from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { promise } from 'ember-awesome-macros';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';

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

export default EmberObject.extend(OwnerInjector, {
  fileManager: service(),

  /**
   * @virtual
   * @type {models/Transfer}
   */
  transfer: undefined,

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

  /**
   * @virtual
   * @type {Object}
   */
  forbiddenOperations: undefined,

  isLoading: false,

  /**
   * Total number of files, which has to be processed (scanned) during this
   * transfer. It's available only for ongoing transfers.
   * @type {number|null}
   */
  filesToProcess: null,

  transferId: reads('transfer.entityId'),
  userName: reads('userProxy.content.name'),
  replicatedFiles: reads('transfer.transferProgressProxy.replicatedFiles'),
  evictedFiles: reads('transfer.transferProgressProxy.evictedFiles'),
  processedFiles: reads('transfer.transferProgressProxy.processedFiles'),
  status: reads('transfer.transferProgressProxy.status'),
  transferProgressError: reads('transfer.transferProgressProxy.reason'),
  type: reads('transfer.type'),

  userProxy: promise.object(computed('transfer', 'spaceId', function userProxy() {
    const {
      transfer,
      spaceId,
    } = this.getProperties('transfer', 'spaceId');
    return transfer.fetchUser(spaceId);
  })),

  scheduledAtReadable: computedPipe('transfer.scheduleTime', timeReadable),
  startedAtReadable: computedPipe('transfer.startTime', timeReadable),
  finishedAtReadable: computedPipe('transfer.finishTime', timeReadable),
  totalBytesReadable: computedPipe(
    'transfer.transferProgressProxy.replicatedBytes',
    bytesToString
  ),

  /**
   * Displayed desitnation name
   * @type {ComputedProperty<String>}
   */
  destination: computed(
    'providers.@each.{entityId,name}',
    'transfer.replicatingProvider',
    function destination() {
      const destinationId = this.get('transfer.replicatingProvider.entityId');
      // eviction transfer
      if (!destinationId) {
        return '‐';
      }
      let _destination = '?';
      const destProvider = _destination ?
        this.get('providers').findBy('entityId', destinationId) : null;
      if (destProvider) {
        _destination = get(destProvider, 'name');
      }
      return _destination;
    }
  ),

  /**
   * Check if status is one of the allowed states in the claimed collection
   * (table type).
   * @type {ComputedProperty<boolean>}
   */
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

  filesToProcessSetter: observer(
    'transfer.{state,dataSourceType,dataSourceId}',
    async function filesToProcessSetter() {
      const {
        dataSourceType,
        dataSourceId,
        state,
      } = getProperties(this.transfer, 'dataSourceType', 'dataSourceId', 'state');

      if (
        typeof this.filesToProcess === 'number' ||
        state !== 'ongoing' ||
        dataSourceType !== 'dir'
      ) {
        return;
      }

      const dirSizeStats = await this.fileManager.getDirCurrentSizeStats(dataSourceId);
      if (dirSizeStats) {
        this.set(
          'filesToProcess',
          dirSizeStats.regFileAndLinkCount + dirSizeStats.dirCount + 1
        );
      }
    }
  ),

  init() {
    this._super(...arguments);

    const {
      transfer,
      transferCollection,
    } = this.getProperties('transfer', 'transferCollection');
    this.reloadRecordIfNeeded(transfer);
    if (transferCollection === 'file') {
      this.addObserver('status', function statusObserver() {
        transfer.reload();
      });
      // enable observer
      this.get('status');
    }
    this.filesToProcessSetter();
  },

  reloadRecordIfNeeded(transfer = this.get('transfer')) {
    const {
      id: transferGri,
      isLoaded: transferIsLoaded,
      isLoading: transferIsLoading,
      transferCollection,
      store,
    } = getProperties(
      transfer,
      'id',
      'isLoaded',
      'isLoading',
      'store',
      'transferCollection'
    );
    if (get(transfer, 'state') !== transferCollection) {
      if (transferIsLoaded) {
        this.set('isLoading', true);
        transfer.reload()
          .then(() =>
            get(transfer, 'transferProgressProxy.isPending') ?
            null : transfer.updateTransferProgressProxy({ replace: true })
          )
          .finally(() => safeExec(this, 'set', 'isLoading', false));
      } else if (transferIsLoading) {
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
    }
  },
});

function timeReadable(timestamp) {
  return (timestamp && moment.unix(timestamp).format(startEndTimeFormat)) || '‐';
}
