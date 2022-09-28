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
import { translateFileCount } from 'onedata-gui-common/utils/file';

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
  processedItems: reads('record.processedItems'),

  /**
   * @type {ComputedProperty<number|null>}
   */
  itemsToProcess: reads('record.itemsToProcess'),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  processedItemsStringified: computed(
    'processedItems',
    function processedItemsStringified() {
      return translateFileCount(this.i18n, null, this.processedItems ?? 0);
    }
  ),

  /**
   * @type {ComputedProperty<number|null>}
   */
  progressPercent: computed(
    'processedItems',
    'itemsToProcess',
    function progressPercent() {
      if (
        !Number.isInteger(this.processedItems) ||
        !Number.isInteger(this.itemsToProcess) ||
        this.itemsToProcess <= 0
      ) {
        return null;
      }

      return Math.min(
        Math.floor((this.processedItems / this.itemsToProcess) * 100),
        100
      );
    }
  ),
});
