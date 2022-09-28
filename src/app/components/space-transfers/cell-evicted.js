/**
 * Cell that shows a number of evicted files.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2018-2022 ACK CYFRONET AGH
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
  classNames: ['cell-evicted'],

  i18n: service(),

  /**
   * @type {ComputedProperty<number>}
   */
  evictedFiles: reads('record.evictedFiles'),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  evictedFilesStringified: computed(
    'evictedFiles',
    function evictedFilesStringified() {
      return translateFileCount(this.i18n, FileType.Regular, this.evictedFiles ?? 0);
    }
  ),
});
