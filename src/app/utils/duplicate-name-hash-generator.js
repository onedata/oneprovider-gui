/**
 * FIXME:
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

// FIXME: maybe naming change: name -> key, because it's keypair values; add jsdoc

import EmberObject from '@ember/object';
import HashGenerator from 'oneprovider-gui/utils/hash-generator';

export default EmberObject.extend({
  hashGenerator: undefined,

  pairMapping: undefined,
  hashMapping: undefined,

  init() {
    this.setProperties({
      pairMapping: {},
      hashMapping: {},
      hashGenerator: new HashGenerator(),
    });
  },

  addName(name, value) {
    if (!this.pairMapping[name]) {
      this.pairMapping[name] = [];
    }
    const currentValues = this.pairMapping[name];
    if (this.pairMapping[name].includes(value)) {
      return;
    }
    currentValues.push(value);
    let isNewHashValueAdded = false;
    if (currentValues.length > 1) {
      for (const knownValue of currentValues) {
        if (this.hashMapping[knownValue]) {
          continue;
        }
        const hashValue = this.hashGenerator.getHash(knownValue);
        this.hashMapping[knownValue] = hashValue;
        isNewHashValueAdded = true;
      }
    }
    if (isNewHashValueAdded) {
      this.notifyPropertyChange('hashMapping');
    }
  },
});
