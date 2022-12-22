/**
 * Cell that shows total processed/scanned items (both files and directories) count.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { translateFileCount, FileType } from 'onedata-gui-common/utils/file';

export default Component.extend({
  tagName: 'span',
  classNames: ['cell-processed'],

  i18n: service(),

  /**
   * @virtual
   * @type {TransferTableRecord}
   */
  record: undefined,

  /**
   * @type {ComputedProperty<number>}
   */
  processedFiles: reads('record.processedFiles'),

  /**
   * @type {ComputedProperty<number|null>}
   */
  filesToProcess: reads('record.filesToProcess'),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  processedFilesStringified: computed(
    'processedFiles',
    function processedFilesStringified() {
      return translateFileCount(this.i18n, FileType.Regular, this.processedFiles ?? 0);
    }
  ),

  /**
   * @type {ComputedProperty<number|null>}
   */
  progressPercent: computed(
    'processedFiles',
    'filesToProcess',
    function progressPercent() {
      if (
        !Number.isInteger(this.processedFiles) ||
        !Number.isInteger(this.filesToProcess) ||
        this.filesToProcess <= 0
      ) {
        return null;
      }

      return Math.min(
        Math.floor((this.processedFiles / this.filesToProcess) * 100),
        100
      );
    }
  ),
});
