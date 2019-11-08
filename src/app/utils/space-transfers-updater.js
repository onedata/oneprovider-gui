/**
 * Updates transfers data for single space (except time statistics) by polling
 * 
 * Optionally update:
 * - collection of current transfers records with their current stats
 * - collection of completed transfers records
 * - handle updates of current stats when moving transfer from current to done
 *
 * @module utils/space-transfers-updater
 * @author Jakub Liput
 * @copyright (C) 2017-2018 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

/** 
 * How many milliseconds to wait between polling for single transfer data
 * @type {number}
 */
const transferCollectionDelay = 300;

const defaultFileTime = 8 * 1000;
const defaultScheduledTime = 4 * 1000;
const defaultCompletedTime = 8 * 1000;
const mapTime = 5100;

const minItemsCount = 50;

import Looper from 'onedata-gui-common/utils/looper';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import EmberObject, { computed, observer, set, get } from '@ember/object';
import { debounce, later } from '@ember/runloop';
import { Promise, all as allFulfilled } from 'rsvp';
import _ from 'lodash';
import ENV from 'oneprovider-gui/config/environment';
import gri from 'onedata-gui-websocket-client/utils/gri';
// import { entityType as transferEntityType } from 'oneprovider-gui/models/transfer';

// TODO: (low) update providers if there is provider referenced that is not on
// list; this can help with dynamically added providers

export default EmberObject.extend({
  /**
   * @virtual
   * Store service
   * @type {Ember.Service}
   */
  store: undefined,

  /**
   * @virtual
   * The model of space, will be used to perform fetching
   * @type {Space}
   */
  space: undefined,

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
   * Only transfers with these ids will be updated
   * @type {Array<string>}
   */
  visibleIds: Object.freeze([]),

  /**
   * Polling interval (ms) used for fetching scheduled transfers list
   * @type {number}
   */
  pollingTimeScheduled: defaultScheduledTime,

  /**
   * Polling interval (ms) used for fetching transfers list for file
   * @type {number}
   */
  pollingTimeFile: defaultFileTime,

  /**
   * Polling interval (ms) used for fetching current transfers
   * @type {number}
   */
  pollingTimeCurrent: computed(
    'visibleIds.length',
    'basePollingTime',
    function pollingTimeCurrent() {
      const currentTransfersCount = this.get('visibleIds.length');
      return currentTransfersCount ? this.computeCurrentPollingTime(
          currentTransfersCount) :
        this.get('basePollingTime');
    }
  ),

  /**
   * Polling interval (ms) used for fetching completed transfers
   * @type {number}
   */
  pollingTimeCompleted: defaultCompletedTime,

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
  scheduledEnabled: true,

  /**
   * @type {boolean}
   */
  currentEnabled: true,

  /**
   * @type {boolean}
   */
  transferProgressEnabled: true,

  /**
   * @type {boolean}
   */
  completedEnabled: true,

  /**
   * @type {boolean}
   */
  mapEnabled: true,

  _fileEnabled: computed('fileEnabled', 'isEnabled', function () {
    return this.get('isEnabled') && this.get('fileEnabled');
  }),

  _scheduledEnabled: computed('scheduledEnabled', 'isEnabled', function () {
    return this.get('isEnabled') && this.get('scheduledEnabled');
  }),

  _currentEnabled: computed('currentEnabled', 'isEnabled', function () {
    return this.get('isEnabled') && this.get('currentEnabled');
  }),

  _transferProgressEnabled: computed('transferProgressEnabled', 'isEnabled',
    function () {
      return this.get('isEnabled') && this.get('transferProgressEnabled');
    }),

  _completedEnabled: computed('completedEnabled', 'isEnabled', function () {
    return this.get('isEnabled') && this.get('completedEnabled');
  }),

  _mapEnabled: computed('mapEnabled', 'isEnabled', function () {
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
   * Updates info about scheduled transfers
   * @type {Looper}
   */
  _scheduledWatcher: undefined,

  /**
   * Initialized with `_createWatchers`.
   * Updates info about current transfers:
   * - space.currentTransferList
   *   - for each transfer: transfer.transferProgress
   * @type {Looper}
   */
  _currentWatcher: undefined,

  /**
   * Update visible transfers current stats
   * @type {Looper}
   */
  _transferProgressWatcher: undefined,

  /**
   * @type {Looper}
   */
  _completedWatcher: undefined,

  /**
   * @type {Looper}
   */
  _mapWatcher: undefined,

  /**
   * If true, currently fetching info about current transfers
   * Set by some interval watcher
   * @type {boolean}
   */
  currentIsUpdating: undefined,

  /**
   * If true, currently fetching info about providers transfer mapping
   * Set by some interval watcher
   * @type {boolean}
   */
  mapIsUpdating: undefined,

  /**
   * If true, currently fetching info about completed transfers
   * Set by some interval watcher
   * @type {boolean}
   */
  completedIsUpdating: undefined,

  /**
   * Error object from fetching current transfers info
   * @type {any} typically a request error object
   */
  currentError: null,

  /**
   * Error object from fetching providers transfer mapping info
   * @type {any} typically a request error object
   */
  mapError: null,

  /**
   * Error object from fetching completed transfers info
   * @type {any} typically a request error object
   */
  completedError: null,

  /**
   * How much time [ms] to debounce when some property changes that
   * can occur watchers reconfiguration.
   * Set it to 0 for tests purposes.
   * @type {number}
   */
  _toggleWatchersDelay: computed(() => ENV.environment === 'test' ? 0 : 5),

  observeToggleWatchers: observer(
    '_fileEnabled',
    '_scheduledEnabled',
    '_currentEnabled',
    '_transferProgressEnabled',
    '_completedEnabled',
    '_mapEnabled',
    'pollingTimeFile',
    'pollingTimeScheduled',
    'pollingTimeCurrent',
    'pollingTimeCompleted',
    'pollingTimeMap',
    '_toggleWatchersDelay',
    function observeToggleWatchers() {
      debounce(this, '_toggleWatchers', this.get('_toggleWatchersDelay'), true);
    }),

  init() {
    this._super(...arguments);

    this.set('updaterId', new Date().getTime());

    this.setProperties({
      fileIsUpdating: false,
      scheduledIsUpdating: false,
      currentIsUpdating: false,
      completedIsUpdating: false,
      mapIsUpdating: false,
    });

    this._createWatchers();
    this._toggleWatchers();

    // enable observers for properties
    this.getProperties(
      '_fileEnabled',
      '_scheduledEnabled',
      '_currentEnabled',
      '_transferProgressEnabled',
      '_completedEnabled',
      '_mapEnabled'
    );
  },

  destroy() {
    try {
      _.each(
        _.values(
          this.getProperties(
            '_fileWatcher',
            '_scheduledWatcher',
            '_currentWatcher',
            '_transferProgressWatcher',
            '_completedWatcher',
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

    const _scheduledWatcher = Looper.create({
      immediate: true,
    });
    _scheduledWatcher
      .on('tick', () =>
        safeExec(this, 'fetchScheduled')
      );

    const _currentWatcher = Looper.create({
      immediate: true,
    });
    _currentWatcher
      .on('tick', () =>
        safeExec(this, 'fetchCurrent')
      );

    const _transferProgressWatcher = Looper.create({
      immediate: true,
    });
    _transferProgressWatcher
      .on('tick', () =>
        safeExec(this, 'updateCurrentStats')
      );

    const _completedWatcher = Looper.create({
      immediate: true,
    });
    _completedWatcher
      .on('tick', () =>
        safeExec(this, 'fetchCompleted')
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
      _scheduledWatcher,
      _currentWatcher,
      _transferProgressWatcher,
      _completedWatcher,
      _mapWatcher,
    });
  },

  _toggleWatchers() {
    // this method is invoked from debounce, so it's "this" can be destroyed
    safeExec(this, () => {
      const {
        _fileEnabled,
        _scheduledEnabled,
        _currentEnabled,
        _transferProgressEnabled,
        _completedEnabled,
        _mapEnabled,
        _fileWatcher,
        _scheduledWatcher,
        _currentWatcher,
        _transferProgressWatcher,
        _completedWatcher,
        _mapWatcher,
        pollingTimeFile,
        pollingTimeScheduled,
        pollingTimeCurrent,
        pollingTimeCompleted,
        pollingTimeMap,
      } = this.getProperties(
        '_fileEnabled',
        '_scheduledEnabled',
        '_currentEnabled',
        '_transferProgressEnabled',
        '_completedEnabled',
        '_mapEnabled',
        '_fileWatcher',
        '_scheduledWatcher',
        '_currentWatcher',
        '_transferProgressWatcher',
        '_completedWatcher',
        '_mapWatcher',
        'pollingTimeFile',
        'pollingTimeScheduled',
        'pollingTimeCurrent',
        'pollingTimeCompleted',
        'pollingTimeMap'
      );

      set(
        _fileWatcher,
        'interval',
        _fileEnabled ? pollingTimeFile : null
      );
      set(
        _scheduledWatcher,
        'interval',
        _scheduledEnabled ? pollingTimeScheduled : null
      );
      set(
        _currentWatcher,
        'interval',
        _currentEnabled ? pollingTimeCurrent : null
      );
      set(
        _completedWatcher,
        'interval',
        _completedEnabled ? pollingTimeCompleted : null
      );
      set(
        _mapWatcher,
        'interval',
        _mapEnabled ? pollingTimeMap : null
      );
      set(
        _transferProgressWatcher,
        'interval',
        _transferProgressEnabled ? pollingTimeCurrent : null
      );
    });
  },

  /**
   * Fetch or reload transfers with given Ids
   * @param {Array<string>} ids 
   * @param {boolean} reload 
   * @returns {Promise<Array<Model.Transfer>>}
   */
  fetchSpecificRecords(ids, reload = false) {
    const store = this.get('store');
    // FIXME: backend
    const gris = ids;
    // const entityType = transferEntityType;
    // const entityType = 'transfer';
    // const gris = ids.map(id => gri({
    //   entityType,
    //   entityId: id,
    //   aspect: 'instance',
    //   scope: 'private',
    // }));
    return allFulfilled(gris.map(gri =>
      store.findRecord('transfer', gri, { reload })
      .then(transfer => {
        if (reload) {
          return transfer.updateTransferProgressProxy();
        } else {
          return transfer;
        }
      })
    ));
  },

  /**
   * Function invoked when file transfers should be updated by polling timer
   * @return {Promise<Array<TransferCurrentStat>>} resolves with current stats
   *    of updated current transfers
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
   * Function invoked when current transfers should be updated by polling timer
   * @return {Promise<Array<TransferCurrentStat>>} resolves with current stats
   *    of updated current transfers
   */
  fetchCurrent() {
    this.set('currentIsUpdating', true);

    const {
      space,
    } = this.getProperties('space');

    return get(space, 'currentTransferList').reload({
        head: true,
        minSize: minItemsCount,
      })
      .catch(error => safeExec(this, () => this.set('currentError', error)))
      .finally(() => safeExec(this, () => this.set('currentIsUpdating', false)));
  },

  updateCurrentStats(immediate = false) {
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
                '_reloadTransferCurrentStat',
                transfer,
                i,
                transfersCount
              )
            ));
        }
      }));
  },

  _reloadTransferCurrentStat(transfer, index, transfersCount) {
    const pollingTimeCurrent = this.get('pollingTimeCurrent');
    const delay = (pollingTimeCurrent * index) / transfersCount;
    return new Promise((resolve, reject) => {
      later(
        () => {
          // checking if updater is still in use
          if (!this.isDestroyed) {
            transfer.updateTransferProgressProxy()
              .then(resolve)
              .catch(reject);
          }
        },
        delay
      );
    });
  },

  computeCurrentPollingTime(transfersCount) {
    return transferCollectionDelay * transfersCount + this.get('basePollingTime');
  },

  /**
   * Function invoked when providers transfer mapping should be updated by
   * polling timer
   * @return {Promise<Object>}
   */
  fetchProviderMap() {
    this.set('mapIsUpdating', true);
    return this.get('space').updateTransfersActiveChannelsProxy()
      .catch(error => safeExec(this, () => this.set('mapError', error)))
      .finally(() => safeExec(this, () => this.set('mapIsUpdating', false)));
  },

  /**
   * Get front of completed transfers list
   * @returns {Promise<Array<Transfer>>} transfers that was added to completed list
   */
  fetchCompleted() {
    if (this.get('completedIsUpdating') !== true) {
      const space = this.get('space');

      this.set('completedIsUpdating', true);

      return get(space, 'completedTransferList').reload({
          head: true,
          minSize: minItemsCount,
        })
        .catch(error => safeExec(this, () => this.set('completedError', error)))
        .finally(() => safeExec(this, () => this.set('completedIsUpdating', false)));
    } else {
      console.debug('util:space-transfers-updater: fetchCompleted skipped');
    }
  },

  /**
   * @returns {Promise<Array<Transfer>>}
   */
  fetchScheduled() {
    if (this.get('completedIsUpdating') !== true) {
      const space = this.get('space');

      this.set('scheduledIsUpdating', true);

      return get(space, 'scheduledTransferList').reload({
          head: true,
          minSize: minItemsCount,
        })
        .catch(error => safeExec(this, () => this.set('scheduledError', error)))
        .finally(() => safeExec(this, () => this.set('scheduledIsUpdating', false)));
    } else {
      console.debug('util:space-transfers-updater: fetchScheduled skipped');
    }
  },
});
