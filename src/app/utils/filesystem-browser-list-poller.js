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
import FileConsumerMixin, {
  computedSingleUsedFileGri,
} from 'oneprovider-gui/mixins/file-consumer';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';
import { conditional, raw } from 'ember-awesome-macros';

const mixins = [
  FileConsumerMixin,
];

export default BrowserListPoller.extend(...mixins, {
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
   * @override
   * @implements {Mixins.FileConsumer}
   */
  usedFileGris: conditional(
    'browserModel.previewMode',
    raw([]),
    computedSingleUsedFileGri('dir')
  ),

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  fileRequirements: computed(
    'browserModel.previewMode',
    'dir',
    function fileRequirements() {
      if (!this.dir || this.browserModel?.previewMode) {
        return [];
      }
      return [
        new FileRequirement({
          fileGri: this.get('dir.id'),
          properties: ['isRecalling'],
        }),
      ];
    }
  ),

  /**
   * @type {ComputedProperty<Models.File|undefined>}
   */
  dir: reads('browserModel.dir'),

  isRecalling: reads('dir.isRecalling'),
});
