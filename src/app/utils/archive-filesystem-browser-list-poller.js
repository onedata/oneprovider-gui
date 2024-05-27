/**
 * Implementation of polling for filesystem in archive.
 *
 * As in base polling implementation, polling is enabled or disabled by browser model
 * property.
 *
 * @author Jakub Liput
 * @copyright (C) 2023-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { all as allFulfilled } from 'rsvp';
import FilesystemBrowserListPoller from 'oneprovider-gui/utils/filesystem-browser-list-poller';
import { reads } from '@ember/object/computed';
import { computed } from '@ember/object';

export default FilesystemBrowserListPoller.extend({
  /**
   * @type {ComputedProperty<Models.Archive>}
   */
  archive: reads('browserModel.archive'),

  /**
   * In archive filesystem browser, polling is enabled when archive is being
   * built or there are columns that can change over time (eg. replication).
   * In case of archive creation, we want to observe changes quickly.
   * @override
   */
  pollInterval: computed('browserModel.isFilesystemLive', function pollInterval() {
    return this.browserModel.isFilesystemLive ? 2000 : this._super(...arguments);
  }),

  /**
   * @override
   */
  async poll() {
    const listRefreshPromise = this._super(...arguments);
    return allFulfilled([
      listRefreshPromise,
      this.archive.reload(),
    ]);
  },
});
