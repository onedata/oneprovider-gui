import EmberObject, { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { conditional } from 'ember-awesome-macros';
import { EdmPropertyValueType } from 'oneprovider-gui/utils/edm/property-spec';

const PropertyViewModel = EmberObject.extend({
  visualEdmViewModel: undefined,
  edmObjectModel: undefined,
  model: undefined,

  // FIXME: redukcja powyższych na podstawie poniższego
  propertyGroupViewModel: undefined,

  /**
   * @type {VisualEdmPropertyValueType}
   */
  valueType: undefined,

  referenceValue: computed('model.attrs', function referenceValue() {
    return this.model.attrs.resource;
  }),

  value: conditional(
    'isUsingReference',
    'referenceValue',
    'model.value'
  ),

  isUsingReference: reads('model.isUsingResource'),

  init() {
    this._super(...arguments);
    this.set(
      'valueType',
      this.isUsingReference ?
      EdmPropertyValueType.Reference : EdmPropertyValueType.Literal
    );
  },

  updateView() {
    this.notifyPropertyChange('model');
  },

  changeValue(newValue) {
    if (this.valueType === EdmPropertyValueType.Reference) {
      this.model.attrs.resource = newValue;
    } else {
      this.model.value = newValue;
    }
    this.notifyPropertyChange('value');
  },

  changeValueType(valueType) {
    if (valueType === this.valueType) {
      return;
    }
    const prevValue = this.value;
    if (this.valueType === EdmPropertyValueType.Literal) {
      this.changeValue('');
    } else if (this.valueType === EdmPropertyValueType.Reference) {
      this.changeValue(null);
    }
    this.set('valueType', valueType);
    this.changeValue(prevValue);
    this.updateView();
  },

  deleteProperty() {
    this.propertyGroupViewModel.objectViewModel.model.deleteProperty(this.model);
    this.propertyGroupViewModel.objectViewModel.updateView();
  },
});

export default PropertyViewModel;
