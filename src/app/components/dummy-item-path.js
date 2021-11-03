import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { set, get } from '@ember/object';

export default Component.extend({
  classNames: ['dummy-item-path'],

  mockBackend: service(),

  item: reads('mockBackend.entityRecords.chainDir.3'),

  init() {
    this._super(...arguments);
    this.testResizeUpdate();
    this.testTransitionDetection();
    this.testNamesChange();
  },

  testResizeUpdate() {
    // test resize updates (it caused too-short-path rendering problem formerly)
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 1000);
  },

  testTransitionDetection() {
    // test transition detection
    setTimeout(() => {
      document.querySelectorAll('.transitionable').forEach(element => {
        element.classList.add('transitioned');
      });
    }, 2000);
  },

  testNamesChange() {
    // test path items names change
    setTimeout(async () => {
      let item = this.get('item');
      while (item) {
        set(item, 'name', 'xyz123');
        item = await get(item, 'parent');
      }
    }, 7000);
  },
});
