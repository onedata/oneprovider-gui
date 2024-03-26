import Component from '@ember/component';
import { set, computed, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { htmlSafe } from '@ember/string';
import humanizeString from 'oneprovider-gui/utils/humanize-string';
import { conditional, eq, raw, bool } from 'ember-awesome-macros';
import { EdmPropertyValueType } from 'oneprovider-gui/utils/edm/property-spec';
import { EdmPropertyRecommendation } from 'oneprovider-gui/utils/edm/property-spec';
import animateCss from 'onedata-gui-common/utils/animate-css';
import waitForRender from 'onedata-gui-common/utils/wait-for-render';
import sleep from 'onedata-gui-common/utils/sleep';

// FIXME: jak najwięcej przenieść logiki do property-view-model

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
  viewModel: undefined,

  /**
   * @type {Utils.VisualEdmViewModel}
   */
  visualEdmViewModel: reads('viewModel.visualEdmViewModel'),

  /**
   * @type {EdmObject}
   */
  edmObjectModel: reads('viewModel.propertyGroupViewModel.objectViewModel.model'),

  /**
   * @type {VisualEdmPropertyValueType}
   */
  valueType: reads('viewModel.valueType'),

  EdmPropertyValueType,

  // FIXME: property robocze
  isSupportingReference: true,

  isUsingReference: reads('viewModel.model.isUsingResource'),

  isShowingReference: reads('isUsingReference'),

  valueIcon: conditional(
    eq('valueType', raw('literal')),
    raw('browser-rename'),
    raw('text-link'),
  ),

  inputType: computed('viewModel.model.edmPropertyType', function inputType() {
    // FIXME: dodać do specyfikacji
    if (this.viewModel.model.edmPropertyType === 'description') {
      return 'textarea';
    } else if (this.viewModel.model.hasPredefinedValues) {
      return 'dropdown';
    } else {
      return 'input';
    }
  }),

  referenceValue: computed('viewModel.model.attrs', function referenceValue() {
    return this.viewModel.model.attrs.resource;
  }),

  value: reads('viewModel.value'),

  isAddAnotherEnabled: computed('viewModel.model.edmPropertyType', function inputType() {
    if (this.model.edmPropertyType === 'title') {
      return true;
    } else {
      return false;
    }
  }),

  lang: computed('viewModel.model.attrs', function lang() {
    return this.viewModel.model.attrs.lang;
  }),

  isLangEnabled: bool('lang'),

  isAnyValueType: eq(
    'viewModel.model.supportedValueType',
    raw(EdmPropertyValueType.Any)
  ),

  predefinedValueOptions: computed(
    'inputType',
    'viewModel.model.predefinedValues',
    function predefinedValueOptions() {
      if (this.inputType !== 'dropdown') {
        return null;
      }
      return this.viewModel.model.predefinedValues;
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
    'viewModel.model.{shownAttrs,attrs}',
    function attrItems() {
      const attrs = this.viewModel.model.attrs;
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
      if (this.viewModel.model.isReadOnly) {
        result = result.filter(({ value }) => value);
      }
      return result;
    }
  ),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  displayedPropertyName: computed(
    'viewModel.model.{namespace,edmPropertyType}',
    function displayedPropertyName() {
      let text;
      text = this.t(
        `propertyName.${this.viewModel.model.namespace}.${this.viewModel.model.edmPropertyType}.${this.edmObjectModel.edmObjectType}`, {}, {
          defaultValue: null,
        }
      );
      if (text) {
        return text;
      }
      text = this.t(
        `propertyName.${this.viewModel.model.namespace}.${this.viewModel.model.edmPropertyType}`, {}, {
          defaultValue: null,
        }
      );
      if (text) {
        return text;
      }
      return htmlSafe(humanizeString(this.viewModel.model.edmPropertyType));
    }
  ),

  recommendationClassName: computed(
    'viewModel.{validator.isError,model.recommendation}',
    function recommendationClassName() {
      const classes = ['edm-recommendation-label'];
      if (
        this.viewModel.model.recommendation === EdmPropertyRecommendation.Mandatory &&
        this.viewModel.validator?.isError
      ) {
        classes.push('text-danger');
      }
      return classes.join(' ');
    }
  ),

  recommendationLabel: computed(
    'viewModel.model.recommendation',
    function recommendationLabel() {
      return this.t(
        `recommendation.${this.viewModel.model.recommendation}`, {}, {
          defaultValue: '',
        }
      );
    }
  ),

  deleteButtonTip: computed('viewModel.isDeleteDisabled', function deleteButtonTip() {
    return this.t(
      this.viewModel.isDeleteDisabled ?
      'cannotDeleteOnlyMandatory' : 'deletePropertyTip'
    );
  }),

  animateAttentionObserver: observer(
    'viewModel.isAnimateAttentionQueued',
    function animateAttentionObserver() {
      this.tryExecuteAnimateAttention();
    }
  ),

  /**
   * @override
   */
  didInsertElement() {
    this._super(...arguments);
    window.aaa = this;
    this.tryExecuteAnimateAttention();
  },

  async tryExecuteAnimateAttention() {
    if (!this.element) {
      return;
    }
    if (this.viewModel.isAnimateAttentionQueued) {
      this.animateAttention();
    }
  },

  async animateAttention() {
    try {
      await sleep(0);
      this.element.scrollIntoView({ block: 'center' });
      await animateCss(this.element, 'pulse-bg-variable');
    } finally {
      set(this.viewModel, 'isAttentionAnimationQueued', false);
    }
  },

  actions: {
    /**
     * @param {VisualEdmPropertyValueType} valueType
     */
    changeValueType(valueType) {
      this.viewModel.changeValueType(valueType);
    },
    changeSelectedPredefinedValueOption(option) {
      this.viewModel.changeValue(option.value);
    },
    changeValue(newValue) {
      this.viewModel.changeValue(newValue);
    },
    changeLanguage(newValue) {
      this.viewModel.changeAttribute('lang', newValue || null);
    },
    deleteProperty() {
      this.viewModel.deleteProperty();
    },
    handleInputBlur() {
      set(this.viewModel, 'wasInputFocused', true);
    },
  },
});
