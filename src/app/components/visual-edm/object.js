/**
 * Graphical editable or readonly representation of EDM object.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import humanizeString from 'oneprovider-gui/utils/humanize-string';

/**
 * @typedef {Object} EdmPropertyGroup
 * @property {EdmPropertyType} edmPropertyType
 * @property {string} namespace
 * @property {Array<EdmProperty>} edmProperties
 */

export default Component.extend(I18n, {
  tagName: 'li',
  classNames: [
    'visual-edm-object',
    'modern-iconified-block',
    'iconified-block',
  ],
  classNameBindings: [
    'hasSomeProperties::has-no-properties',
  ],

  /**
   * @override
   */
  i18nPrefix: 'components.visualEdm.object',

  /**
   * @virtual
   * @type {Utils.VisualEdm.ObjectViewModel}
   */
  viewModel: undefined,

  /**
   * @type {ComputedProperty<Utils.VisualEdmViewModel>}
   */
  visualEdmViewModel: reads('viewModel.visualEdmViewModel'),

  objectIcon: 'browser-metadata',

  isAddPropertyOpened: false,

  hasSomeProperties: reads('edmProperties.length'),

  /**
   * @type {Computed<Array<EdmProperty>>}
   */
  edmProperties: reads('viewModel.edmProperties'),

  objectTypeName: computed('viewModel.model.edmObjectType', function objectTypeName() {
    const objectType = this.viewModel.model.edmObjectType;
    return this.t(`objectTypeName.${objectType}`, {}, { defaultValue: objectType });
  }),

  attrItems: computed(
    'viewModel.model.{shownAttrs,attrs}',
    'visualEdmViewModel.isReadOnly',
    function attrItems() {
      // settings attributes is not available in edit mode
      if (!this.visualEdmViewModel.isReadOnly) {
        return [];
      }
      const attrs = this.viewModel.model.attrs;
      const result = this.viewModel.model.shownAttrs.map(name => {
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
      return result.filter(result => Boolean(result));
    }
  ),

  addPropertyButtonSelector: computed('elementId', function addPropertyButtonSelector() {
    return `#${this.elementId} .add-edm-property-btn`;
  }),

  deleteObjectTip: computed('viewModel.model.edmObjectType', function deleteObjectTip() {
    const objectType = this.viewModel.model.edmObjectType;
    return this.t('deleteObjectTip', {
      objectType: this.t(
        `objectTypeName.${objectType}`, {}, { defaultValue: this.t('object') }
      ),
    });
  }),

  objectTypeSubtitle: computed(
    'viewModel.model.edmObjectType',
    function objectTypeSubtitle() {
      const type = this.viewModel.model.edmObjectType;
      return this.t(`objectTypeSubtitle.${type}`, {}, { defaultValue: null });
    }
  ),

  closeAddProperty() {
    this.set('isAddPropertyOpened', false);
  },

  actions: {
    toggleAddPropertyOpen(open) {
      this.set(
        'isAddPropertyOpened',
        typeof open === 'boolean' ? open : !this.isAddPropertyOpened
      );
    },
    /**
     * @param {VisualEdm.AddPropertySelectorSpec} item
     */
    addProperty(item) {
      this.viewModel.addProperty(item);
      this.closeAddProperty();
    },
    cancelPropertySelect() {
      this.closeAddProperty();
    },
    deleteObject() {
      this.viewModel.deleteObject();
    },
  },
});
