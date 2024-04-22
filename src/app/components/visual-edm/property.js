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
import { EdmPropertyValueType, EdmPropertyRecommendation } from 'oneprovider-gui/utils/edm/property-spec';
import animateCss from 'onedata-gui-common/utils/animate-css';
import sleep from 'onedata-gui-common/utils/sleep';
import isUrl from 'onedata-gui-common/utils/is-url';

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

  noOptions: computed('viewModel.{isAnyValueType,isLangConfigurable}', function noOptions() {
    return !this.viewModel.isAnyValueType && !this.viewModel.isLangConfigurable;
  }),

  isValueLink: computed('value', function isValueLink() {
    return isUrl(this.value);
  }),

  tip: computed(
    'viewModel.model.example',
    'edmObjectModel.edmObjectType',
    function tip() {
      let exampleValue = this.viewModel.model.example;
      if (exampleValue && typeof exampleValue === 'object') {
        exampleValue = exampleValue[this.edmObjectModel.edmObjectType];
      }
      if (!exampleValue) {
        return null;
      }
      return this.t('example', { exampleValue });
    }
  ),

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
