import EmberObject, { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { eq, raw, conditional } from 'ember-awesome-macros';
import { EdmPropertyValueType } from 'oneprovider-gui/utils/edm/property-spec';
import { EdmPropertyRecommendation } from '../edm/property-spec';
import EdmPropertyValidator from '../edm/property-validator';

const PropertyViewModel = EmberObject.extend({
  visualEdmViewModel: undefined,
  edmObjectModel: undefined,
  model: undefined,

  // FIXME: redukcja powyższych na podstawie poniższego
  propertyGroupViewModel: undefined,

  objectViewModel: reads('propertyGroupViewModel.objectViewModel'),

  /**
   * @type {boolean}
   */
  wasInputFocused: false,

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

  isDeleteDisabled: computed(
    'objectViewModel.singleInstancePropertyTags',
    'propertyGroupViewModel.propertiesViewModels.length',
    'isTheOnlyPropertyInGroup',
    function isDeleteDisabled() {
      return this.model.recommendation === EdmPropertyRecommendation.Mandatory &&
        this.isTheOnlyPropertyInGroup;
    }
  ),

  isTheOnlyPropertyInGroup: eq(
    'propertyGroupViewModel.propertiesViewModels.length',
    raw(1)
  ),

  isFirstPropertyInGroup: computed(
    'propertyGroupViewModel.propertyViewModels',
    function isFirstPropertyInGroup() {
      return this.propertyGroupViewModel.propertiesViewModels[0] === this;
    }
  ),

  isLangConfigurable: reads('model.isLangConfigurable'),

  formGroupClassName: computed(
    'wasInputFocused',
    'validator.isError',
    function formGroupClassName() {
      const classes = ['form-group'];
      if (this.wasInputFocused) {
        classes.push(this.validator.isError ? 'has-error' : 'has-success');
      }
      return classes.join(' ');
    }
  ),

  init() {
    this._super(...arguments);
    this.set(
      'valueType',
      this.isUsingReference ?
      EdmPropertyValueType.Reference : EdmPropertyValueType.Literal
    );
    this.set('validator', EdmPropertyValidator.create({
      edmProperty: this.model,
    }));
  },

  updateView() {
    this.notifyPropertyChange('model');
    this.validator.updateValue();
  },

  changeValue(newValue) {
    if (this.valueType === EdmPropertyValueType.Reference) {
      this.model.attrs.resource = newValue;
    } else {
      this.model.value = newValue;
    }
    this.updateView();
  },

  changeAttribute(attributeName, newValue) {
    this.model.attrs[attributeName] = newValue;
    this.updateView();
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
  },

  deleteProperty() {
    this.propertyGroupViewModel.objectViewModel.model.deleteProperty(this.model);
    this.propertyGroupViewModel.objectViewModel.updateView();
  },
});

export default PropertyViewModel;
