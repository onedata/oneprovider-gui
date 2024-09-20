/**
 * Graphical editable or readonly representation of EDM property.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { set, computed, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/i18n';
import humanizeString from 'oneprovider-gui/utils/humanize-string';
import {
  EdmPropertyValueType,
  EdmPropertyRecommendation,
} from 'oneprovider-gui/utils/edm/property-spec';
import { getLangSelectorOptions } from 'oneprovider-gui/utils/edm/lang-spec';
import animateCss from 'onedata-gui-common/utils/animate-css';
import sleep from 'onedata-gui-common/utils/sleep';
import isUrl from 'onedata-gui-common/utils/is-url';
import { htmlSafe } from '@ember/string';
import { anchorizeText } from 'onedata-gui-common/utils/anchorize-text';

/**
 * @typedef {EdmPropertyValueType.Literal|EdmPropertyValueType.Reference} VisualEdmPropertyValueType
 */

export default Component.extend(I18n, {
  classNames: ['visual-edm-property'],
  classNameBindings: ['noOptions'],

  visualEdmTranslation: service(),

  /**
   * @override
   */
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

  /**
   * @type {Array<{ label: string, value: string }>}
   */
  langOptions: undefined,

  value: reads('viewModel.value'),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  displayedPropertyName: computed(
    'viewModel.model.{namespace,edmPropertyType}',
    'edmObjectModel.edmObjectType',
    function displayedPropertyName() {
      return this.visualEdmTranslation.getDisplayedPropertyName(
        this.viewModel.model.namespace,
        this.viewModel.model.edmPropertyType,
        this.edmObjectModel.edmObjectType
      );
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

  /**
   * @type {ComputedProperty<SafeString|undefined>}
   */
  deleteButtonTip: computed(
    'viewModel.{isDeleteDisabled,isDeleteDisabledForMandatory}',
    function deleteButtonTip() {
      if (this.viewModel.isDeleteDisabled) {
        if (this.viewModel.isDeleteDisabledForMandatory) {
          return this.t('cannotDeleteOnlyMandatory');
        }
      } else {
        return this.t('deletePropertyTip');
      }
    }
  ),

  attrItems: computed(
    'viewModel.model.attrs',
    'isLangDefault',
    'isReadOnly',
    function attrItems() {
      const attrs = this.viewModel.model.attrs;
      // TODO: VFS-12238 Consider showing more attributes (or simplify code)
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

  noOptions: computed('viewModel.{isAnyValueType,isLangConfigurable}', function noOptions() {
    return !this.viewModel.isAnyValueType && !this.viewModel.isLangConfigurable;
  }),

  isValueLink: computed('value', function isValueLink() {
    return isUrl(this.value);
  }),

  tip: computed(
    'isReadOnly',
    // Do not observe model, because every updateView causes unnecessary recomputation
    // of this property. Model is always set on init, so it should not change.
    'viewModel',
    'edmObjectModel.edmObjectType',
    function tip() {
      if (this.isReadOnly) {
        // currently tip is built only for examples - in readonly mode example is unwanted
        return;
      }
      let tipString = '';
      const specTip = this.viewModel.model.spec.tip;
      if (specTip) {
        tipString += `<p>${specTip}</p>`;
      }

      let exampleValue = this.viewModel.model.example;
      if (exampleValue && typeof exampleValue === 'object') {
        exampleValue = exampleValue[this.edmObjectModel.edmObjectType];
      }
      if (exampleValue) {
        exampleValue = htmlSafe(exampleValue);
        tipString += `<p>${this.t('example', { exampleValue })}</p>`;
      }

      return tipString && htmlSafe(
        anchorizeText(tipString, { class: 'navy text-underlined', target: '_blank' })
      );
    }
  ),

  /**
   * Can be only single class, because it is used to construct `tipTriggerSelector`.
   * @type {string}
   */
  tipClass: 'edm-property-type-label-tip',

  /**
   * @type {ComputedProperty<string>}
   */
  tipTriggerSelector: computed('elementId', 'tipClass', function tipTriggerSelector() {
    return `#${this.elementId} .${this.tipClass}`;
  }),

  placeholder: computed(
    // Do not observe model, because every updateView causes unnecessary recomputation
    // of this property. Model is always set on init, so it should not change.
    'viewModel',
    'valueType',
    function placeholder() {
      const placeholderExample = this.viewModel.model.placeholderExample;
      let exampleValue;
      if (typeof placeholderExample === 'object') {
        exampleValue = placeholderExample[this.valueType];
      } else {
        exampleValue = placeholderExample;
      }

      return typeof exampleValue === 'string' ?
        this.t('examplePlaceholder', { exampleValue: htmlSafe(exampleValue) }) : '';
    }
  ),

  formGroupClassName: computed(
    'viewModel.{wasInputUsed,validator.isError}',
    'inputFeedbackIcon',
    function formGroupClassName() {
      const classes = ['form-group'];
      if (this.viewModel.wasInputUsed && this.viewModel.validator?.isError) {
        classes.push('has-error');
      }
      if (this.inputFeedbackIcon) {
        classes.push('has-feedback');
      }
      return classes.join(' ');
    }
  ),

  inputFeedbackIcon: computed(
    'viewModel.{wasInputUsed,validator.errors.length}',
    function inputFeedbackIcon() {
      if (!this.viewModel.wasInputUsed) {
        return;
      }
      if (this.viewModel.validator?.errors.length) {
        return 'checkbox-filled-warning';
      }
    }
  ),

  animateAttentionObserver: observer(
    'viewModel.isAnimateAttentionQueued',
    function animateAttentionObserver() {
      this.tryExecuteAnimateAttention();
    }
  ),

  init() {
    this._super(...arguments);
    this.set('langOptions', getLangSelectorOptions());
  },

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
      if (this.isDestroyed || this.isDestroying) {
        return;
      }
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
      this.viewModel.markInputAsUsed();
    },
    changeLanguage(option) {
      this.viewModel.changeAttribute('lang', option.value || null);
    },
    deleteProperty() {
      this.viewModel.deleteProperty();
    },
    handleInputBlur() {
      this.viewModel.markInputAsUsed();
    },
    matchLangOption(option, searchString) {
      return option.matchesSearchString(searchString) ? 1 : -1;
    },
  },
});
