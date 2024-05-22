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
    if (this.edmProperty.value && this.edmProperty.attrs.resource != null) {
      return [
        new EdmPropertyBothValueTypesError(this.edmProperty),
      ];
    }
    const supportedValue = this.edmProperty.getSupportedValue();
    if (!supportedValue?.trim()) {
      return [
        new EdmPropertyEmptyValueError(this.edmProperty),
      ];
    }
    if (this.edmProperty.hasPredefinedValues) {
      return this.edmProperty.predefinedValues
        .map(({ value }) => value)
        .includes(supportedValue) ? [] : [
          new EdmPropertyNonEnumValueError(this.edmProperty),
        ];
    }
    return [];
  }),

  updateValue() {
    this.notifyPropertyChange('edmProperty');
  },
});

export class EdmPropertyBothValueTypesError {
  constructor(edmProperty) {
    this.edmProperty = edmProperty;
  }
  toString() {
    return `both value and reference specified in ${this.edmProperty.xmlTagName}`;
  }
}

export class EdmPropertyEmptyValueError {
  edmObjectType = null;

  constructor(edmProperty) {
    this.edmProperty = edmProperty;
  }
  toString() {
    return `property "${this.edmProperty.xmlTagName}" has empty value`;
  }
}

export class EdmPropertyNonEnumValueError {
  edmObjectType = null;

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
