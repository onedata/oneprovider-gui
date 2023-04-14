/**
 * Controls polling of the current browser items list.
 * Remember to use `destroy` on the instance when polling is not needed anymore!
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject from '@ember/object';
import { reads } from '@ember/object/computed';
import Looper from 'onedata-gui-common/utils/looper';
import { conditional, raw, and, not } from 'ember-awesome-macros';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';

// FIXME: revert to 10s
export const defaultPollInterval = 1000;

export default EmberObject.extend({
  /**
   * @virtual
   * @type {Utils.BaseBrowserModel}
   */
  browserModel: undefined,

  pollInterval: defaultPollInterval,

  //#region state

  /**
   * @type {Utils.Looper}
   */
  looper: null,

  /**
   * State indicating, that the poll method started but not settled yet.
   * @type {boolean}
   */
  isPollingNow: false,

  /**
   * @type {Promise}
   */
  lastPollingPromise: null,

  //#endregion

  selectedItemsOutOfScope: reads('browserModel.selectedItemsOutOfScope'),

  isPollingEnabled: and(
    'browserModel.isListPollingEnabled',
    not('browserModel.selectedItemsOutOfScope'),
  ),

  init() {
    this._super(...arguments);
    this.initLooper();
  },

  initLooper() {
    if (this.looper) {
      return;
    }
    const looper = Looper
      .extend({
        interval: conditional(
          'browserListPoller.isPollingEnabled',
          'browserListPoller.pollInterval',
          raw(0),
        ),
      })
      .create({
        browserListPoller: this,
      });
    looper.on('tick', () => this.executePoll());
    this.set('looper', looper);
  },

  async poll() {
    await this.browserModel.refresh({ silent: true });
  },

  /**
   * Wrapper for the custom procedure of polling (which is encouraged to be overriden).
   * Does not allow to be invoked while other async poll is in progress and sets
   * `isPollingNow` state of the poller.
   * @returns
   */
  async executePoll() {
    if (this.isPollingNow) {
      return this.lastPollingPromise;
    }
    this.set('isPollingNow', true);
    try {
      const pollingPromise = this.poll();
      this.set('lastPollingPromise', pollingPromise);
      await pollingPromise;
    } finally {
      safeExec(this, 'set', 'isPollingNow', false);
    }
  },

  restartInterval() {
    this.looper?.restartInterval();
  },

  /**
   * @override
   */
  willDestroy() {
    this.looper?.destroy();
    this.set('looper', null);
  },
});
