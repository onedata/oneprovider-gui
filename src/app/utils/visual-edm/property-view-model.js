import EmberObject, { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { eq, raw, conditional, not } from 'ember-awesome-macros';
import { EdmPropertyValueType } from 'oneprovider-gui/utils/edm/property-spec';
import { EdmPropertyRecommendation } from '../edm/property-spec';

const PropertyViewModel = EmberObject.extend({
  /**
   * @virtual
   * @type {EdmProperty}
   */
  model: undefined,

  /**
   * @virtual
   * @type {Utils.VisualEdm.PropertyGroupViewModel}
   */
  propertyGroupViewModel: undefined,

  /**
   * @virtual
   * @type {EdmPropertyValidator}
   */
  validator: undefined,

  objectViewModel: reads('propertyGroupViewModel.objectViewModel'),

  visualEdmViewModel: reads('objectViewModel.visualEdmViewModel'),

  /**
   * @type {boolean}
   */
  wasInputFocused: false,

  /**
   * @type {VisualEdmPropertyValueType}
   */
  valueType: undefined,

  /**
   * @type {boolean}
   */
  isAnimateAttentionQueued: false,

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
      if (this.wasInputFocused && this.validator?.isError) {
        classes.push('has-error');
      }
      return classes.join(' ');
    }
  ),

  valueIcon: conditional(
    eq('valueType', raw('literal')),
    raw('browser-rename'),
    raw('text-link'),
  ),

  inputType: computed(
    'model.{edmPropertyType,isPossibleLongValue}',
    function inputType() {
      if (this.model.isPossibleLongValue) {
        return 'textarea';
      } else if (this.model.hasPredefinedValues) {
        return 'dropdown';
      } else {
        return 'input';
      }
    }
  ),

  lang: computed('model.attrs', function lang() {
    return this.model.attrs.lang;
  }),

  isLangDefault: not('lang'),

  isAnyValueType: eq(
    'model.supportedValueType',
    raw(EdmPropertyValueType.Any)
  ),

  predefinedValueOptions: computed(
    'inputType',
    'model.predefinedValues',
    function predefinedValueOptions() {
      if (this.inputType !== 'dropdown') {
        return null;
      }
      return this.model.predefinedValues;
    }
  ),

  selectedPredefinedValueOption: computed(
    'predefinedValueOptions',
    'value',
    function selectedPredefinedValueOption() {
      return this.predefinedValueOptions?.find(({ value }) => value === this.value);
    }
  ),

  isImageRendered: computed(
    'visualEdmViewModel.isReadOnly',
    'model.xmlTagName',
    function isImageRendered() {
      return this.visualEdmViewModel.isReadOnly &&
        this.model.xmlTagName === 'edm:object';
    }
  ),

  init() {
    this._super(...arguments);
    if (
      this.visualEdmViewModel.isReadOnly ||
      this.model.supportedValueType === EdmPropertyValueType.Any
    ) {
      this.set(
        'valueType',
        this.isUsingReference ?
        EdmPropertyValueType.Reference : EdmPropertyValueType.Literal
      );
    } else {
      this.set('valueType', this.model.supportedValueType);
    }
  },

  animateAttention() {
    this.set('isAnimateAttentionQueued', true);
  },

  updateView() {
    this.notifyPropertyChange('model');
    this.validator?.updateValue();
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
