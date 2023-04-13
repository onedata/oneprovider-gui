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

export const defaultPollInterval = 10000;

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
    looper.on('tick', () => this.poll(this.browserModel));
    this.set('looper', looper);
  },

  async poll() {
    if (this.isPollingNow) {
      return;
    }
    this.set('isPollingNow', true);
    try {
      return await this.browserModel.refresh({ silent: true });
    } finally {
      this.set('isPollingNow', false);
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
