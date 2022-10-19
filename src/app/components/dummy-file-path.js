import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { set, get, computed } from '@ember/object';
import sleep from 'onedata-gui-common/utils/sleep';

export default Component.extend({
  classNames: ['dummy-file-path'],

  mockBackend: service(),

  file: computed('mockBackend.entityRecords.chainDir', function file() {
    return this.mockBackend.entityRecords.chainDir.at(-1);
  }),

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
      'testNamesChangeShortOther',
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
    let file = this.get('file');
    while (file) {
      set(file, 'name', 'xyz123');
      file = await get(file, 'parent');
    }
  },

  async testNamesChangeShortOther() {
    // test path items names change to other version of short to test the-same-width
    // changes detection
    let file = this.get('file');
    while (file) {
      set(file, 'name', 'abc456');
      file = await get(file, 'parent');
    }
  },

  async testNamesChangeLonger() {
    // test path items names change to longer
    let file = this.get('file');
    while (file) {
      set(file, 'name', 'Amet pariatur velit adipisicing');
      file = await get(file, 'parent');
    }
  },
});
