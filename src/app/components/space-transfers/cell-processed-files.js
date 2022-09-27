/**
 * Cell that shows total processed (scanned) files number.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';

export default Component.extend({
  tagName: 'span',
  classNames: ['cell-processed-files'],

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
