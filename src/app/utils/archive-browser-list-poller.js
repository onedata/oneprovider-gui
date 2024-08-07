/**
 * Implementation of polling for archives.
 *
 * @author Jakub Liput
 * @copyright (C) 2023-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BrowserListPoller, { defaultPollInterval } from 'oneprovider-gui/utils/browser-list-poller';
import { reads } from '@ember/object/computed';
import { get } from '@ember/object';
import { asyncObserver } from 'onedata-gui-common/utils/observer';

const slowPollInterval = defaultPollInterval;

const fastPollInterval = 2000;

export default BrowserListPoller.extend({
  archives: reads('browserModel.itemsArray'),

  // Using observer to change interval instead of computed property to suppress set
  // of interval property when it does not change (this would invoke).
  archivesObserver: asyncObserver(
    'archives.@each.metaState',
    function archivesObserver() {
      this.reconfigurePollInterval();
    }
  ),

  init() {
    this._super(...arguments);
    this.reconfigurePollInterval();
  },

  /**
   * @override
   */
  async poll() {
    await this._super(...arguments);
    this.reconfigurePollInterval();
  },

  reconfigurePollInterval() {
    if (!this.archives) {
      return;
    }
    const isAnyArchiveInProgress = this.archives.toArray().some(archive => {
      return ['creating', 'destroying'].includes(get(archive, 'metaState'));
    });
    if (isAnyArchiveInProgress && this.pollInterval !== fastPollInterval) {
      this.set('pollInterval', fastPollInterval);
    } else if (!isAnyArchiveInProgress && this.pollInterval !== slowPollInterval) {
      this.set('pollInterval', slowPollInterval);
    }
  },
});
