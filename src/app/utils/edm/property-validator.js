/**
 * Provides EDM property model validation state according to recommendation of Eureka 3D.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed } from '@ember/object';
import { empty, not } from '@ember/object/computed';

const EdmPropertyValidator = EmberObject.extend({
  /**
   * @virtual
   * @type {EdmProperty}
   */
  edmProperty: undefined,

  isValid: empty('errors'),

  isError: not('isValid'),

  /**
   * @type {ComputedProperty<Array<EdmPropertyValidatorError>>}
   */
  errors: computed('edmProperty', function errors() {
    const supportedValue = this.edmProperty.getSupportedValue();
    if (this.edmProperty.hasPredefinedValues) {
      return this.edmProperty.predefinedValues
        .map(({ value }) => value)
        .includes(supportedValue) ? [] : [
          new EdmPropertyNonEnumValueError(this.edmProperty),
        ];
    } else {
      return supportedValue?.trim() ? [] : [
        new EdmPropertyEmptyValueError(this.edmProperty),
      ];
    }
  }),

  updateValue() {
    this.notifyPropertyChange('edmProperty');
  },
});

class EdmPropertyEmptyValueError {
  constructor(edmProperty) {
    this.edmProperty = edmProperty;
  }
  toString() {
    return `property "${this.edmProperty.xmlTagName}" has empty value`;
  }
}

class EdmPropertyNonEnumValueError {
  constructor(edmProperty) {
    this.edmProperty = edmProperty;
  }
  toString() {
    return `property "${this.edmProperty.xmlTagName}" has value out of predefined values set`;
  }
}

/**
 * @typedef {EdmPropertyEmptyValueError|EdmPropertyNonEnumValueError} EdmPropertyValidatorError
 */

export default EdmPropertyValidator;
