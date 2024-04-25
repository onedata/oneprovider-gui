/**
 * Model for `VisualEdm::Property` component associated with `EdmProperty` model.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { eq, raw, conditional, not } from 'ember-awesome-macros';
import {
  EdmPropertyRecommendation,
  EdmPropertyValueType,
  langSelectorSpec,
} from '../edm/property-spec';

const langOptionsMapping = langSelectorSpec.reduce((mapping, option) => {
  mapping[option.value] = option;
  return mapping;
}, {});

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

  /**
   * @type {Array<{ label: string, value: string }>}
   */
  langSelectorSpec,

  /**
   * Cannot use `reads` here, because Ember internals crash on "magic" Proxy constructor
   * trying to access Proxy's properties.
   * @type {ComputedProperty<string>}
   */
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

  /**
   * Cannot use `reads` here, because Ember internals crash on "magic" Proxy constructor
   * trying to access Proxy's properties.
   * @type {ComputedProperty<string>}
   */
  lang: computed('model.attrs', function lang() {
    return this.model.attrs.lang;
  }),

  /**
   * @type {{ label: string, value: string }}
   */
  selectedLangOption: computed(
    'lang',
    function selectedLangOption() {
      return langOptionsMapping[this.lang || ''] || { value: this.lang };
    }
  ),

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
      if (!this.value) {
        return;
      }
      const predefinedOption = this.predefinedValueOptions?.find(({ value }) =>
        value === this.value
      );
      if (!predefinedOption) {
        return { value: this.value };
      }
      return this.predefinedValueOptions?.find(({ value }) => value === this.value);
    }
  ),

  isImageRendered: computed(
    'visualEdmViewModel.{isReadOnly,isRepresentativeImageShown}',
    'model.xmlTagName',
    function isImageRendered() {
      return this.visualEdmViewModel.isRepresentativeImageShown &&
        this.visualEdmViewModel.isReadOnly &&
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
    if (this.value) {
      this.set('wasInputFocused', true);
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
