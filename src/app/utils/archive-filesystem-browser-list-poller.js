/**
 * Implementation of polling for filesystem in archive.
 *
 * As in base polling implementation, polling is enabled or disabled by browser model
 * property.
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { all as allFulfilled } from 'rsvp';
import FilesystemBrowserListPoller from 'oneprovider-gui/utils/filesystem-browser-list-poller';
import { reads } from '@ember/object/computed';

export default FilesystemBrowserListPoller.extend({
  /**
   * @type {ComputedProperty<Models.Archive>}
   */
  archive: reads('browserModel.archive'),

  /**
   * @override
   * In archive filesystem browser, polling is enabled only when archive is being
   * built and we want to observe changes quickly.
   */
  pollInterval: 2000,

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
