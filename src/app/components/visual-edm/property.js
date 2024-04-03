import Component from '@ember/component';
import { set, computed, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { htmlSafe } from '@ember/string';
import humanizeString from 'oneprovider-gui/utils/humanize-string';
import { EdmPropertyValueType, EdmPropertyRecommendation } from 'oneprovider-gui/utils/edm/property-spec';
import animateCss from 'onedata-gui-common/utils/animate-css';
import sleep from 'onedata-gui-common/utils/sleep';

/**
 * @typedef {EdmPropertyValueType.Literal|EdmPropertyValueType.Reference} VisualEdmPropertyValueType
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

  /**
   * Expose the enum to template.
   * @type {EdmPropertyValueType}
   */
  EdmPropertyValueType,

  value: reads('viewModel.value'),

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

  attrItems: computed(
    'viewModel.model.attrs',
    'isLangDefault',
    'isReadOnly',
    function attrItems() {
      const attrs = this.viewModel.model.attrs;
      // TODO: VFS-11911 Consider showing more attributes (or simplify code)
      const shownAttrs = this.isLangDefault ? [] : ['lang'];
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
      if (this.isReadOnly) {
        result = result.filter(({ value }) => value);
      }
      return result;
    }
  ),

  inputType: reads('viewModel.inputType'),

  isReadOnly: reads('visualEdmViewModel.isReadOnly'),

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
