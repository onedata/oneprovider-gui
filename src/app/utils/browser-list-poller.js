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
import { conditional, raw } from 'ember-awesome-macros';

export default EmberObject.extend({
  /**
   * @virtual
   * @type {Utils.BaseBrowserModel}
   */
  browserModel: undefined,

  pollInterval: 10000,

  //#region state

  looper: null,

  //#region

  isPollingEnabled: reads('browserModel.isListPollingEnabled'),

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

  /**
   * @param {Utils.BaseBrowserModel} browserModel
   */
  async poll(browserModel) {
    return browserModel.refresh({ silent: true });
  },

  destroy() {
    this.looper?.destroy();
    this.set('looper', null);
  },
});
