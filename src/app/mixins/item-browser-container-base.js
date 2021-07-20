import Mixin from '@ember/object/mixin';
import { once } from '@ember/runloop';
import { get, observer, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { promise } from 'ember-awesome-macros';

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

  injectedSelectedChanged: observer(
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

  changeSelectedItems(selectedItems) {
    once(this, 'changeSelectedItemsImmediately', selectedItems);
  },

  changeSelectedItemsImmediately(selectedItems) {
    this.set('selectedItems', selectedItems);
  },
});
