/**
 * Provides EDM property model validation state according to recommendation of Eureka 3D.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed } from '@ember/object';
import { EdmPropertyValueType } from './property-spec';
import { not } from 'ember-awesome-macros';

const EdmPropertyValidator = EmberObject.extend({
  /**
   * @virtual
   * @type {EdmProperty}
   */
  edmProperty: undefined,

  isValid: computed('edmProperty', function isValid() {
    if (this.edmProperty.hasPredefinedValues) {
      return this.edmProperty.predefinedValues
        .map(({ value }) => value)
        .includes(this.getValueByType());
    } else {
      return Boolean(this.getValueByType());
    }
  }),

  isError: not('isValid'),

  getValueByType() {
    switch (this.edmProperty.supportedValueType) {
      case EdmPropertyValueType.Any:
        return this.edmProperty.value || this.edmProperty.attrs.resource;
      case EdmPropertyValueType.Literal:
        return this.edmProperty.value;
      case EdmPropertyValueType.Reference:
        return this.edmProperty.attrs.resource;
      default:
        break;
    }
  },

  updateValue() {
    this.notifyPropertyChange('edmProperty');
  },
});

export default EdmPropertyValidator;
