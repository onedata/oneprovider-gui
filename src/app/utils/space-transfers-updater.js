/**
 * Updates transfers data for single space (except time statistics) by polling
 * 
 * Optionally update:
 * - collection of waiting transfers records
 * - collection of ongoing transfers records with their progress
 * - collection of ended transfers records
 * - handle updates of progress when moving transfer from ongoing to ended
 * - transfers active channels
 *
 * @module utils/space-transfers-updater
 * @author Jakub Liput
 * @copyright (C) 2017-2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

/** 
 * How many milliseconds to wait between polling for single transfer data
 * @type {number}
 */
const transferCollectionDelay = 300;

const defaultFileTime = 8 * 1000;
const defaultWaitingTime = 4 * 1000;
const defaultEndedTime = 8 * 1000;
const mapTime = 5100;

const minItemsCount = 50;

import Looper from 'onedata-gui-common/utils/looper';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import EmberObject, { computed, observer, set, get } from '@ember/object';
import { debounce, later } from '@ember/runloop';
import { Promise, all as allFulfilled } from 'rsvp';
import _ from 'lodash';
import ENV from 'oneprovider-gui/config/environment';
import { entityType as transferEntityType } from 'oneprovider-gui/models/transfer';
import gri from 'onedata-gui-websocket-client/utils/gri';

// TODO: (low) update providers if there is provider referenced that is not on
// list; this can help with dynamically added providers

export default EmberObject.extend({
  /**
   * @virtual
   * Store service
   * @type {Ember.Service}
   */
  store: undefined,

  // FIXME: probably to remove
  /**
   * @virtual
   * The model of space, will be used to perform fetching
   * @type {Space}
   */
  space: undefined,

  waitingTransfersArray: undefined,
  ongoingTransfersArray: undefined,
  endedTransfersArray: undefined,

  /**
   * After init, update is disabled by default
   * @virtual
   * @type {boolean}
   */
  isEnabled: false,

  /**
   * @virtual
   * @type {File}
   */
  file: undefined,

  /**
   * Minimum time for polling (if there are no transfers)
   * @type {Number}
   */
  basePollingTime: 3 * 1000,

  /**
   * Only transfers with these ids (entity ids) will be updated
   * @type {Array<string>}
   */
  visibleIds: Object.freeze([]),

  /**
   * Polling interval (ms) used for fetching waiting transfers list
   * @type {number}
   */
  pollingTimeWaiting: defaultWaitingTime,

  /**
   * Polling interval (ms) used for fetching transfers list for file
   * @type {number}
   */
  pollingTimeFile: defaultFileTime,

  /**
   * Polling interval (ms) used for fetching ongoing transfers
   * @type {number}
   */
  pollingTimeOngoing: computed(
    'visibleIds.length',
    'basePollingTime',
    function pollingTimeOngoing() {
      const ongoingTransfersCount = this.get('visibleIds.length');
      return ongoingTransfersCount ?
        this.computeOngoingPollingTime(ongoingTransfersCount) :
        this.get('basePollingTime');
    }
  ),

  /**
   * Polling interval (ms) used for fetching ended transfers
   * @type {number}
   */
  pollingTimeEnded: defaultEndedTime,

  /**
   * Polling interval (ms) used for fetching transfers map
   * @type {number}
   */
  pollingTimeMap: mapTime,

  /**
   * @type {boolean}
   */
  fileEnabled: true,

  /**
   * @type {boolean}
   */
  waitingEnabled: true,

  /**
   * @type {boolean}
   */
  ongoingEnabled: true,

  /**
   * @type {boolean}
   */
  transferProgressEnabled: true,

  /**
   * @type {boolean}
   */
  endedEnabled: true,

  /**
   * @type {boolean}
   */
  mapEnabled: true,

  _fileEnabled: computed('fileEnabled', 'isEnabled', function _fileEnabled() {
    return this.get('isEnabled') && this.get('fileEnabled');
  }),

  _waitingEnabled: computed('waitingEnabled', 'isEnabled', function _waitingEnabled() {
    return this.get('isEnabled') && this.get('waitingEnabled');
  }),

  _ongoingEnabled: computed('ongoingEnabled', 'isEnabled', function _ongoingEnabled() {
    return this.get('isEnabled') && this.get('ongoingEnabled');
  }),

  _transferProgressEnabled: computed('transferProgressEnabled', 'isEnabled',
    function _transferProgressEnabled() {
      return this.get('isEnabled') && this.get('transferProgressEnabled');
    }),

  _endedEnabled: computed('endedEnabled', 'isEnabled', function _endedEnabled() {
    return this.get('isEnabled') && this.get('endedEnabled');
  }),

  _mapEnabled: computed('mapEnabled', 'isEnabled', function _mapEnabled() {
    return this.get('isEnabled') && this.get('mapEnabled');
  }),

  /**
   * Initialized with `_createWatchers`.
   * Updates info about transfers belong to file (if file is present)
   * @type {Looper}
   */
  _fileWatcher: undefined,

  /**
   * Initialized with `_createWatchers`.
   * Updates info about waiting transfers
   * @type {Looper}
   */
  _waitingWatcher: undefined,

  /**
   * Initialized with `_createWatchers`.
   * Updates info about ongoing transfers and for each: transfer.transferProgress
   * @type {Looper}
   */
  _ongoingWatcher: undefined,

  /**
   * Update visible transfers ongoing stats
   * @type {Looper}
   */
  _transferProgressWatcher: undefined,

  /**
   * @type {Looper}
   */
  _endedWatcher: undefined,

  /**
   * @type {Looper}
   */
  _mapWatcher: undefined,

  /**
   * If true, currently fetching info about ongoing transfers.
   * Set by some interval watcher.
   * @type {boolean}
   */
  ongoingIsUpdating: undefined,

  /**
   * If true, currently fetching info about providers transfer mapping.
   * Set by some interval watcher.
   * @type {boolean}
   */
  mapIsUpdating: undefined,

  /**
   * If true, currently fetching info about ended transfers.
   * Set by some interval watcher.
   * @type {boolean}
   */
  endedIsUpdating: undefined,

  /**
   * Error object from fetching ongoing transfers info.
   * @type {any} typically a request error object
   */
  ongoingError: null,

  /**
   * Error object from fetching providers transfer mapping info.
   * @type {any} typically a request error object
   */
  mapError: null,

  /**
   * Error object from fetching ended transfers info.
   * @type {any} typically a request error object
   */
  endedError: null,

  /**
   * How much time [ms] to debounce when some property changes that
   * can occur watchers reconfiguration.
   * Set it to 0 for tests purposes.
   * @type {number}
   */
  _toggleWatchersDelay: computed(() => ENV.environment === 'test' ? 0 : 5),

  observeToggleWatchers: observer(
    '_fileEnabled',
    '_waitingEnabled',
    '_ongoingEnabled',
    '_transferProgressEnabled',
    '_endedEnabled',
    '_mapEnabled',
    'pollingTimeFile',
    'pollingTimeWaiting',
    'pollingTimeOngoing',
    'pollingTimeEnded',
    'pollingTimeMap',
    '_toggleWatchersDelay',
    function observeToggleWatchers() {
      debounce(this, '_toggleWatchers', this.get('_toggleWatchersDelay'), true);
    }),

  init() {
    // FIXME: debug
    window.spaceTransfersUpdater = this;

    this._super(...arguments);

    this.set('updaterId', new Date().getTime());

    this.setProperties({
      fileIsUpdating: false,
      waitingIsUpdating: false,
      ongoingIsUpdating: false,
      endedIsUpdating: false,
      mapIsUpdating: false,
    });

    this._createWatchers();
    this._toggleWatchers();

    // enable observers for properties
    this.getProperties(
      '_fileEnabled',
      '_waitingEnabled',
      '_ongoingEnabled',
      '_transferProgressEnabled',
      '_endedEnabled',
      '_mapEnabled'
    );
  },

  destroy() {
    try {
      _.each(
        _.values(
          this.getProperties(
            '_fileWatcher',
            '_waitingWatcher',
            '_ongoingWatcher',
            '_transferProgressWatcher',
            '_endedWatcher',
            '_mapWatcher'
          )
        ),
        watcher => watcher && watcher.destroy()
      );
    } finally {
      this._super(...arguments);
    }
  },

  /**
   * Create watchers for fetching information
   */
  _createWatchers() {
    const _fileWatcher = Looper.create({
      immediate: true,
    });
    _fileWatcher
      .on('tick', () =>
        safeExec(this, 'fetchFile')
      );

    const _waitingWatcher = Looper.create({
      immediate: true,
    });
    _waitingWatcher
      .on('tick', () =>
        safeExec(this, 'fetchWaiting')
      );

    const _ongoingWatcher = Looper.create({
      immediate: true,
    });
    _ongoingWatcher
      .on('tick', () =>
        safeExec(this, 'fetchOngoing')
      );

    const _transferProgressWatcher = Looper.create({
      immediate: true,
    });
    _transferProgressWatcher
      .on('tick', () =>
        safeExec(this, 'updateVisibleTransfersProgress')
      );

    const _endedWatcher = Looper.create({
      immediate: true,
    });
    _endedWatcher
      .on('tick', () =>
        safeExec(this, 'fetchEnded')
      );

    const _mapWatcher = Looper.create({
      immediate: true,
    });
    _mapWatcher
      .on('tick', () =>
        safeExec(this, 'fetchProviderMap')
      );

    this.setProperties({
      _fileWatcher,
      _waitingWatcher,
      _ongoingWatcher,
      _transferProgressWatcher,
      _endedWatcher,
      _mapWatcher,
    });
  },

  _toggleWatchers() {
    // this method is invoked from debounce, so it's "this" can be destroyed
    safeExec(this, () => {
      const {
        _fileEnabled,
        _waitingEnabled,
        _ongoingEnabled,
        _transferProgressEnabled,
        _endedEnabled,
        _mapEnabled,
        _fileWatcher,
        _waitingWatcher,
        _ongoingWatcher,
        _transferProgressWatcher,
        _endedWatcher,
        _mapWatcher,
        pollingTimeFile,
        pollingTimeWaiting,
        pollingTimeOngoing,
        pollingTimeEnded,
        pollingTimeMap,
      } = this.getProperties(
        '_fileEnabled',
        '_waitingEnabled',
        '_ongoingEnabled',
        '_transferProgressEnabled',
        '_endedEnabled',
        '_mapEnabled',
        '_fileWatcher',
        '_waitingWatcher',
        '_ongoingWatcher',
        '_transferProgressWatcher',
        '_endedWatcher',
        '_mapWatcher',
        'pollingTimeFile',
        'pollingTimeWaiting',
        'pollingTimeOngoing',
        'pollingTimeEnded',
        'pollingTimeMap'
      );

      set(
        _fileWatcher,
        'interval',
        _fileEnabled ? pollingTimeFile : null
      );
      set(
        _waitingWatcher,
        'interval',
        _waitingEnabled ? pollingTimeWaiting : null
      );
      set(
        _ongoingWatcher,
        'interval',
        _ongoingEnabled ? pollingTimeOngoing : null
      );
      set(
        _endedWatcher,
        'interval',
        _endedEnabled ? pollingTimeEnded : null
      );
      set(
        _mapWatcher,
        'interval',
        _mapEnabled ? pollingTimeMap : null
      );
      set(
        _transferProgressWatcher,
        'interval',
        _transferProgressEnabled ? pollingTimeOngoing : null
      );
    });
  },

  /**
   * Fetch or reload transfers with given Ids (entity ids)
   * @param {Array<string>} ids 
   * @param {boolean} reload 
   * @returns {Promise<Array<Model.Transfer>>}
   */
  fetchSpecificRecords(ids, reload = false) {
    const store = this.get('store');
    const entityType = transferEntityType;
    const gris = ids.map(id => gri({
      entityType,
      entityId: id,
      aspect: 'instance',
      scope: 'private',
    }));
    return allFulfilled(gris.map(gri =>
      store.findRecord('transfer', gri, { reload })
      .then(transfer => {
        if (reload) {
          return transfer.updateTransferProgressProxy({ replace: true })
            .then(() => transfer);
        } else {
          return transfer;
        }
      })
    ));
  },

  // FIXME: new implementation
  /**
   * Function invoked when file transfers should be updated by polling timer
   * @return {Promise<Array<TransferOngoingStat>>} resolves with ongoing stats
   *    of updated ongoing transfers
   */
  fetchFile() {
    this.set('fileIsUpdating', true);
    const file = this.get('file');

    return get(file, 'transferList').reload({
        head: true,
        minSize: minItemsCount,
      })
      .catch(error => safeExec(this, () => this.set('fileError', error)))
      .finally(() => safeExec(this, () => this.set('fileIsUpdating', false)));
  },

  /**
   * Function invoked when ongoing transfers should be updated by polling timer
   * @return {Promise<Array<TransferOngoingStat>>} resolves with ongoing stats
   *    of updated ongoing transfers
   */
  fetchOngoing() {
    this.set('ongoingIsUpdating', true);

    return this.get('ongoingTransfersArray').reload({
        minSize: minItemsCount,
      })
      .catch(error => safeExec(this, () => this.set('ongoingError', error)))
      .finally(() => safeExec(this, () => this.set('ongoingIsUpdating', false)));
  },

  updateVisibleTransfersProgress(immediate = false) {
    return this.fetchSpecificRecords(this.get('visibleIds'), false)
      .then(list => safeExec(this, () => {
        const transfersCount = get(list, 'length');
        if (immediate) {
          return allFulfilled(list.map(transfer =>
            transfer.updateTransferProgressProxy({ replace: true })
          ));
        } else {
          return allFulfilled(
            list.map((transfer, i) =>
              safeExec(
                this,
                '_reloadTransferProgress',
                transfer,
                i,
                transfersCount
              )
            ));
        }
      }));
  },

  _reloadTransferProgress(transfer, index, transfersCount) {
    const pollingTimeOngoing = this.get('pollingTimeOngoing');
    const delay = (pollingTimeOngoing * index) / transfersCount;
    return new Promise((resolve, reject) => {
      later(
        () => {
          // checking if updater is still in use
          if (!this.isDestroyed) {
            transfer.updateTransferProgressProxy({ replace: true })
              .then(resolve)
              .catch(reject);
          }
        },
        delay
      );
    });
  },

  computeOngoingPollingTime(transfersCount) {
    return transferCollectionDelay * transfersCount + this.get('basePollingTime');
  },

  /**
   * Function invoked when providers transfer mapping should be updated by
   * polling timer
   * @return {Promise<Object>}
   */
  fetchProviderMap() {
    this.set('mapIsUpdating', true);
    // FIXME: refactor to push channels indepently
    return this.get('space').updateTransfersActiveChannelsProxy({ replace: true })
      .catch(error => safeExec(this, () => this.set('mapError', error)))
      .finally(() => safeExec(this, () => this.set('mapIsUpdating', false)));
  },

  /**
   * Get front of ended transfers list
   * @returns {Promise<Array<Transfer>>} transfers that was added to ended list
   */
  fetchEnded() {
    if (this.get('endedIsUpdating') !== true) {
      this.set('endedIsUpdating', true);

      return this.get('endedTransfersArray').reload({
          minSize: minItemsCount,
        })
        .catch(error => safeExec(this, () => this.set('endedError', error)))
        .finally(() => safeExec(this, () => this.set('endedIsUpdating', false)));
    } else {
      console.debug('util:space-transfers-updater: fetchEnded skipped');
    }
  },

  /**
   * @returns {Promise<Array<Transfer>>}
   */
  fetchWaiting() {
    if (this.get('endedIsUpdating') !== true) {
      this.set('waitingIsUpdating', true);

      return this.get('waitingTransfersArray').reload({
          minSize: minItemsCount,
        })
        .catch(error => safeExec(this, () => this.set('waitingError', error)))
        .finally(() => safeExec(this, () => this.set('waitingIsUpdating', false)));
    } else {
      console.debug('util:space-transfers-updater: fetchWaiting skipped');
    }
  },
});
