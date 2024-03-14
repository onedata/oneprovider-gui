import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { htmlSafe } from '@ember/string';
import humanizeString from 'oneprovider-gui/utils/humanize-string';
import { conditional, eq, raw, bool } from 'ember-awesome-macros';
import { EdmPropertyValueType } from 'oneprovider-gui/utils/edm/property-spec';

/**
 * @type {EdmPropertyValueType.Literal|EdmPropertyValueType.Reference} VisualEdmPropertyValueType
 */

export default Component.extend(I18n, {
  classNames: ['visual-edm-property'],

  i18nPrefix: 'components.visualEdm.property',

  /**
   * @virtual
   * @type {EdmProperty}
   */
  model: undefined,

  /**
   * @virtual
   * @type {Utils.VisualEdmViewModel}
   */
  viewModel: undefined,

  /**
   * @virtual
   * @type {EdmObject}
   */
  edmObjectModel: undefined,

  /**
   * @type {VisualEdmPropertyValueType}
   */
  valueType: undefined,

  // FIXME: property robocze
  isSupportingReference: true,

  isUsingReference: reads('model.isUsingResource'),

  isShowingReference: reads('isUsingReference'),

  valueIcon: conditional(
    eq('valueType', raw('literal')),
    raw('browser-rename'),
    raw('text-link'),
  ),

  inputType: computed('model.edmPropertyType', function inputType() {
    // FIXME: dodać do specyfikacji
    if (this.model.edmPropertyType === 'description') {
      return 'textarea';
    } else if (this.model.hasPredefinedValues) {
      return 'dropdown';
    } else {
      return 'input';
    }
  }),

  referenceValue: computed('model.attrs', function referenceValue() {
    return this.model.attrs.resource;
  }),

  value: conditional(
    'isUsingReference',
    'referenceValue',
    'model.value'
  ),

  isAddAnotherEnabled: computed('model.edmPropertyType', function inputType() {
    if (this.model.edmPropertyType === 'title') {
      return true;
    } else {
      return false;
    }
  }),

  lang: computed('model.attrs', function lang() {
    return this.model.attrs.lang;
  }),

  isLangEnabled: bool('lang'),

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

  // FIXME: do poprawki - za pomocą tego pokazywać tylko propertiesy, które są niestandardowe?
  attrItems: computed(
    'isShowingReference',
    'model.{shownAttrs,attrs}',
    function attrItems() {
      const attrs = this.model.attrs;
      // FIXME: jeśli to jest edycja i to nowy model, to pokazywać tylko
      // reference - jeśli jest isShowingReference
      // lang - jeśli ten model ma takie coś i nie ma isShowingReference
      let shownAttrs;
      if (this.isShowingReference) {
        shownAttrs = ['resource', 'lang'];
      } else {
        shownAttrs = ['lang'];
      }
      let result = shownAttrs.map(name => {
        const foundTranslation = this.t(
          `attrName.${name}`, {}, {
            defaultValue: null,
          }
        );
        return {
          name: foundTranslation || humanizeString(name),
          value: attrs[name],
        };
      });
      if (this.viewModel.isReadOnly) {
        result = result.filter(({ value }) => value);
      }
      return result;
    }
  ),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  displayedPropertyName: computed(
    'model.{namespace,edmPropertyType}',
    function displayedPropertyName() {
      let text;
      text = this.t(
        `propertyName.${this.model.namespace}.${this.model.edmPropertyType}.${this.edmObjectModel.edmObjectType}`, {}, {
          defaultValue: null,
        }
      );
      if (text) {
        return text;
      }
      text = this.t(
        `propertyName.${this.model.namespace}.${this.model.edmPropertyType}`, {}, {
          defaultValue: null,
        }
      );
      if (text) {
        return text;
      }
      return htmlSafe(humanizeString(this.model.edmPropertyType));
    }
  ),

  init() {
    this._super(...arguments);
    this.set('valueType', this.isUsingReference ? EdmPropertyValueType.Reference : EdmPropertyValueType.Literal);
  },

  changeValue(newValue) {
    if (this.valueType === EdmPropertyValueType.Reference) {
      this.model.attrs.resource = newValue;
    } else {
      this.model.value = newValue;
    }
  },

  actions: {
    /**
     * @param {VisualEdmPropertyValueType} valueType
     */
    changeValueType(valueType) {
      this.set('valueType', valueType);
    },
    changeSelectedPredefinedValueOption(option) {
      this.changeValue(option.value);
    },
    changeValue(newValue) {
      this.changeValue(newValue);
    },
  },
});
