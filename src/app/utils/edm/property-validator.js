import EmberObject, { computed } from '@ember/object';
import { EdmPropertyValueType } from './property-spec';
import { not } from 'ember-awesome-macros';

const EdmPropertyValidator = EmberObject.extend({
  /**
   * @virtual
   */
  edmProperty: undefined,

  isValid: computed('edmProperty', function isValid() {
    switch (this.edmProperty.supportedValueType) {
      case EdmPropertyValueType.Any:
        return Boolean(this.edmProperty.value || this.edmProperty.attrs.resource);
      case EdmPropertyValueType.Literal:
        return Boolean(this.edmProperty.value);
      case EdmPropertyValueType.Reference:
        return Boolean(this.edmProperty.attrs.resource);
      default:
        break;
    }
  }),

  isError: not('isValid'),

  updateValue() {
    this.notifyPropertyChange('edmProperty');
  },
});

export default EdmPropertyValidator;
