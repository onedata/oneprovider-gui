/**
 * Updates single transfer chosen time stat data (by polling)
 *
 * @author Jakub Liput
 * @copyright (C) 2017-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Looper from 'onedata-gui-common/utils/looper';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import EmberObject, { computed, observer, set } from '@ember/object';
import { run } from '@ember/runloop';

export default EmberObject.extend({
  /**
   * @virtual
   * When this method is invoked, transfer charts should be updated
   * @returns {Promise<Object>} where object is data resolved by `getThroughputCharts`
   */
  update: undefined,

  /**
   * After init, update is disabled by default
   * @virtual
   * @type {boolean}
   */
  isEnabled: false,

  /**
   * @virtual
   * Will be one of: minute, hour, day, month
   * @type {String}
   */
  timespan: undefined,

  /**
   * Initialized with `_createWatcher`.
   * @type {Looper}
   */
  _watcher: undefined,

  /**
   * If true, currently fetching info about ongoing transfers
   * Set by some interval watcher
   * @type {boolean}
   */
  isUpdating: undefined,

  /**
   * Error object from fetching ongoing transfers info
   * @type {any} typically a request error object
   */
  fetchError: null,

  /**
   * Interval of time stats polling
   * @type {number|null}
   */
  _interval: computed('isEnabled', 'timespan', function () {
    if (this.get('isEnabled')) {
      switch (this.get('timespan')) {
        case 'minute':
          return 5.1 * 1000;
        case 'hour':
          return 10 * 1000;
        case 'day':
          return 60 * 1000;
        case 'month':
          return 5 * 60 * 1000;
        default:
          return null;
      }
    } else {
      return null;
    }
  }),

  init() {
    this._super(...arguments);

    this.setProperties({
      isUpdating: true,
    });

    this._createWatcher();
    this._reconfigureWatcher();

    // get properties to enable observers
    this.getProperties('_interval');
  },

  /**
   * @override
   */
  willDestroy() {
    try {
      const _watcher = this.get('_watcher');
      if (_watcher) {
        this.get('_watcher').destroy();
      }
    } finally {
      this._super(...arguments);
    }
  },

  _reconfigureWatcher: observer(
    '_interval',
    function () {
      // debouncing does not let _setWatchersIntervals to be executed multiple
      // times, which can occur for observer
      run.debounce(this, '_setWatchersIntervals', 1);
    }
  ),

  /**
   * Create watchers for fetching information
   * @returns {undefined}
   */
  _createWatcher() {
    const _watcher = Looper.create({
      immediate: true,
    });
    _watcher.on('tick', () => safeExec(this, 'fetch'));

    this.set('_watcher', _watcher);
  },

  _setWatchersIntervals() {
    // this method is invoked from debounce, so it's "this" can be destroyed
    if (this.isDestroyed === false) {
      const {
        _interval,
        _watcher,
      } = this.getProperties(
        '_interval',
        '_watcher'
      );
      set(_watcher, 'interval', _interval);
    }
  },

  fetch(completeReload) {
    this.set('isUpdating', true);

    return this.get('update')({ replace: !completeReload })
      .then(record => {
        if (!this.get('isDestroyed')) {
          this.set('fetchError', null);
        }
        return record;
      })
      .catch(error => !this.get('isDestroyed') && this.set('fetchError', error))
      .finally(() => !this.get('isDestroyed') && this.set('isUpdating', false));
  },

});
