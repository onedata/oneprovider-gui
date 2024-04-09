/**
 * Provides EDM property model validation state according to recommendation of Eureka 3D.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed } from '@ember/object';
import { not } from 'ember-awesome-macros';

const EdmPropertyValidator = EmberObject.extend({
  /**
   * @virtual
   * @type {EdmProperty}
   */
  edmProperty: undefined,

  isValid: computed('edmProperty', function isValid() {
    const supportedValue = this.edmProperty.getSupportedValue();
    if (this.edmProperty.hasPredefinedValues) {
      return this.edmProperty.predefinedValues
        .map(({ value }) => value)
        .includes(supportedValue);
    } else {
      return Boolean(supportedValue);
    }
  }),

  isError: not('isValid'),

  updateValue() {
    this.notifyPropertyChange('edmProperty');
  },
});

export default EdmPropertyValidator;
