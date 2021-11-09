import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { set, get } from '@ember/object';
import sleep from 'onedata-gui-common/utils/sleep';

export default Component.extend({
  classNames: ['dummy-item-path'],

  mockBackend: service(),

  item: reads('mockBackend.entityRecords.chainDir.3'),

  /**
   * @override
   */
  didInsertElement() {
    this._super(...arguments);
    this.runTests();
  },

  async runTests() {
    const testMethods = [
      'testResizeUpdate',
      'testTransitionDetection',
      'testNamesChangeShorter',
      'testNamesChangeLonger',
    ];
    await sleep(2000);
    for (const method of testMethods) {
      console.log('running test', method);
      await this[method]();
      console.log('wait...');
      await sleep(4000);
    }
    console.log('done');
  },

  async testResizeUpdate() {
    // test resize updates (it caused too-short-path rendering problem formerly)
    window.dispatchEvent(new Event('resize'));
  },

  async testTransitionDetection() {
    // test transition detection
    document.querySelectorAll('.transitionable').forEach(element => {
      element.classList.add('transitioned');
    });
  },

  async testNamesChangeShorter() {
    // test path items names change to shorter
    let item = this.get('item');
    while (item) {
      set(item, 'name', 'xyz123');
      item = await get(item, 'parent');
    }
  },

  async testNamesChangeLonger() {
    // test path items names change to longer
    let item = this.get('item');
    while (item) {
      set(item, 'name', 'Amet pariatur velit adipisicing');
      item = await get(item, 'parent');
    }
  },
});
