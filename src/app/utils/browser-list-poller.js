/**
 * Controls polling of the current browser items list.
 * Remember to use `destroy` on the instance when polling is not needed anymore!
 *
 * @author Jakub Liput
 * @copyright (C) 2023-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject from '@ember/object';
import Looper from 'onedata-gui-common/utils/looper';
import { conditional, raw, and, not, writable } from 'ember-awesome-macros';
import { reads } from '@ember/object/computed';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { DynamicOwnerInjector } from 'onedata-gui-common/mixins/owner-injector';
import { inject as service } from '@ember/service';

export const defaultPollInterval = 10000;

export default EmberObject.extend(DynamicOwnerInjector, {
  onedataWebsocketErrorHandler: service(),

  /**
   * @virtual
   * @type {Utils.BaseBrowserModel}
   */
  browserModel: undefined,

  /**
   * @override
   */
  ownerSource: reads('browserModel'),

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

  isPollingEnabled: and(
    'browserModel.isListPollingEnabled',
    'browserModel.dir',
    not('browserModel.selectedItemsOutOfScope'),
    not('browserModel.anyDataLoadError'),
    not('onedataWebsocketErrorHandler.isConnectionProblem'),
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
        interval: writable(conditional(
          and('browserListPoller.isPollingEnabled', not('isDestroyed')),
          'browserListPoller.pollInterval',
          raw(0),
        ), (value) => value),
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
