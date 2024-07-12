/**
 * Adds render-friendly browser items selection and auto jump-to-item handling
 * by observing `selectedItemsForJumpProxy`.
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Mixin from '@ember/object/mixin';
import { get, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { promise } from 'ember-awesome-macros';
import { syncObserver, asyncObserver } from 'onedata-gui-common/utils/observer';

export default Mixin.create({
  // requires browserModel: BaseBrowserModel`
  // requires `currentBrowsableItemProxy` (recommended) or `dirProxy` (backward
  //   compatibility) with type PromiseObject<Object> (browsable object)
  // optional selectedItemsForJumpProxy: PromiseArray<Object> (browsable obj.)
  // optional space: Models.Space

  /**
   * If true, then selected items are not automatically resetted.
   * See `selectedItemsForJumpChanged` and `ensureSelectedReset`.
   * @type {Boolean}
   */
  lockSelectedReset: false,

  /**
   * Reading `dirProxy` to be backward-compatible.
   * It is recommended to implement this in class.
   * @type {ComputedProperty<PromiseObject<Object>>}
   */
  currentBrowsableItemProxy: reads('dirProxy'),

  /**
   * @type {ComputedProperty<SpacePrivileges>}
   */
  spacePrivileges: reads('space.privileges'),

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
   * @type {ComputedProperty<Array<Object>>} array of browsable items
   */
  selectedItemsForJump: reads('selectedItemsForJumpProxy.content'),

  /**
   * @type {ComputedProperty<Array<Object>>} array of browsable items
   */
  selectedItems: reads('browserModel.selectedItems'),

  // FIXME: opisać syncObserver; przetestować zmianę jumpa
  selectedItemsForJumpChanged: syncObserver(
    'selectedItemsForJumpProxy',
    async function selectedItemsForJumpChanged() {
      const selectedItemsForJump = await this.selectedItemsForJumpProxy;
      if (!selectedItemsForJump || get(selectedItemsForJump, 'length') === 0) {
        return;
      }
      this.set('lockSelectedReset', true);
      try {
        this.browserModel.changeSelectedItems(selectedItemsForJump);
        await this.currentBrowsableItemProxy;
      } finally {
        this.set('lockSelectedReset', false);
      }
    }
  ),

  ensureSelectedReset: asyncObserver(
    'currentBrowsableItemProxy',
    function ensureSelectedReset() {
      if (this.lockSelectedReset) {
        return;
      }
      if (this.browserModel?.selectedItems.length > 0) {
        this.browserModel.changeSelectedItems([]);
      }
    }
  ),
});
