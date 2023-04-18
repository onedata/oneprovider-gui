/**
 * Implementation of polling for filesystem.
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BrowserListPoller, { defaultPollInterval } from 'oneprovider-gui/utils/browser-list-poller';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';

export default BrowserListPoller.extend({
  /**
   * @override
   */
  pollInterval: computed('isRecalling', function pollInterval() {
    if (this.isRecalling) {
      return 2000;
    } else {
      return defaultPollInterval;
    }
  }),

  /**
   * @type {ComputedProperty<Models.File|undefined>}
   */
  dir: reads('browserModel.dir'),

  isRecalling: computed('dir.recallingMembership', function isRecalling() {
    return this.dir?.recallingMembership === 'direct' ||
      this.dir?.recallingMembership === 'ancestor';
  }),
});
