/**
 * Adds render-friendlu browser items selection and auto jump-to-item handling
 * by observing `selectedItemsForJumpProxy`.
 *
 * @module mixins/item-browser-container-base
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Mixin from '@ember/object/mixin';
import { once } from '@ember/runloop';
import { get, observer, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { promise } from 'ember-awesome-macros';
import sleep from 'onedata-gui-common/utils/sleep';

export default Mixin.create({
  // requires selectedItems: Array<Object> (browsable objects)
  // optional selectedItemsForJumpProxy: PromiseArray<Object> (browsable obj.)

  /**
   * NOTE: not observing anything, because it should be one-time proxy
   * @type {PromiseObject<Models.File>}
   */
  initialSelectedItemsForJumpProxy: promise.object(computed(
    function initialSelectedItemsForJumpProxy() {
      return this.get('selectedItemsForJumpProxy');
    }
  )),

  /**
   * @type {ComputedProperty<Array<Object>>} array of browsable item
   */
  selectedItemsForJump: reads('selectedItemsForJumpProxy.content'),

  selectedItemsForJumpChanged: observer(
    'selectedItemsForJumpProxy',
    async function injectedSelectedChanged() {
      const selectedItemsForJump = await this.get('selectedItemsForJumpProxy');
      if (!selectedItemsForJump || get(selectedItemsForJump, 'length') === 0) {
        return;
      }
      this.changeSelectedItems(selectedItemsForJump);
    }
  ),

  init() {
    this._super(...arguments);
    if (!this.get('selectedItems')) {
      this.set('selectedItems', []);
    }
  },

  /**
   * Schedules selected items change - note that `selectedItems` content will not
   * change immediately after using this method - you should wait for next runloop.
   * Using `once` to ensure that selected items are changed once before render, because
   * it caused a lot of trouble to control when change selected items were invoked.
   * @param {Array<Object>} selectedItems array of browsable objects, eg. file
   */
  async changeSelectedItems(selectedItems) {
    once(this, 'changeSelectedItemsImmediately', selectedItems);
    await sleep(0);
  },

  changeSelectedItemsImmediately(selectedItems) {
    this.set('selectedItems', selectedItems);
  },
});
