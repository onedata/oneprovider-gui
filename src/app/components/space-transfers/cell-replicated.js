/**
 * Cell that shows number of files and bytes replicated.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import {
  translateFileCount,
  FileType,
} from 'onedata-gui-common/utils/file';

export default Component.extend({
  tagName: 'span',
  classNames: ['cell-replicated'],

  i18n: service(),

  /**
   * @type {ComputedProperty<number>}
   */
  replicatedFiles: reads('record.replicatedFiles'),

  /**
   * @type {ComputedProperty<number>}
   */
  replicatedBytes: reads('record.replicatedBytes'),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  replicatedFilesStringified: computed(
    'replicatedFiles',
    function replicatedFilesStringified() {
      return translateFileCount(this.i18n, FileType.Regular, this.replicatedFiles ?? 0);
    }
  ),
});
