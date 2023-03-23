/**
 * Implementation of polling for archives.
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BrowserListPoller from 'oneprovider-gui/utils/browser-list-poller';
import { get } from '@ember/object';

const slowPollInterval = 5000;

const fastPollInterval = 2000;

export default BrowserListPoller.extend({
  /**
   * @override
   */
  pollInterval: slowPollInterval,

  /**
   * @override
   */
  async poll() {
    await this._super(...arguments);
    this.reconfigurePollInterval();
  },

  reconfigurePollInterval() {
    // TODO: VFS-7643 due to legacy code, archives list are get using manual call of
    // "getFilesArray" using fbTable API; it will be better to observe items array as
    // property to automatically reconfigure on changes
    const archives = this.browserModel.fbTableApi?.getFilesArray()?.toArray();
    if (!archives) {
      return;
    }
    const isAnyArchiveInProgress = archives.some(archive => {
      return ['creating', 'destroying'].includes(get(archive, 'metaState'));
    });
    if (isAnyArchiveInProgress && this.pollInterval !== fastPollInterval) {
      this.set('pollInterval', fastPollInterval);
    } else if (!isAnyArchiveInProgress && this.pollInterval !== slowPollInterval) {
      this.set('pollInterval', slowPollInterval);
    }
  },
});
