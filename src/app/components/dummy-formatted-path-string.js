/**
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  classNames: ['dummy-formatted-path-string'],

  /**
   * @override
   */
  didInsertElement() {
    this._super(...arguments);
    this.runTests();
  },

  filePath: computed(function filePath() {
    const base = '/krk-p-par-p/';
    return base + this.generateLongPath(['hello', 'world', 'foo', 'bar'], 80);
  }),

  fileInArchivePath: computed(function fileInArchivePath() {
    const base =
      '/krk-p-par-p/.__onedata__archive/dataset_archives_2aa19599223ab67fc5354c864290dbbdch7d43/archive_6e825b9946eb026645bbf7df90b71675ch1eb7/';
    return base + this.generateLongPath(['hello', 'world', 'foo', 'bar'], 40);
  }),

  generateLongPath(names, count) {
    const resultArray = [];
    for (let i = 0; i < count; ++i) {
      resultArray.push(names[i % names.length]);
    }
    return resultArray.join('/');
  },
});
