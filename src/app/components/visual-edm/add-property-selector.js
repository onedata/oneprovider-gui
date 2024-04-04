/**
 * List allowing to choose EDM properties to add to specific EDM object
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { allSpecs } from 'oneprovider-gui/utils/edm/property-spec';
import { sortProperties } from 'oneprovider-gui/utils/edm/sort';

/**
 * @typedef {Object} VisualEdm.AddPropertySelectorSpec
 * @property {SafeString} label
 * @property {EdmPropertySpec} spec
 * @property {string} namespace
 * @property {string} name
 */

export default Component.extend(I18n, {
  classNames: ['space-tags-selector-editor', 'tags-input-selector-editor'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.visualEdm.addPropertySelector',

  /**
   * @virtual
   * @type {Utils.VisualEdm.ObjectViewModel}
   */
  edmObjectViewModel: undefined,

  opened: false,

  onPropertyAdd: undefined,

  onCancel: undefined,

  triggerSelector: undefined,

  //#region state

  /**
   * @type {string}
   */
  filterValue: '',

  //#endregion

  edmObjectType: reads('edmObjectViewModel.edmObjectType'),

  availableItems: computed('singleDisabledItemsTags',
    function availableEdmPropertiesSpecs() {
      return this.createSelectorItems();
    }
  ),

  singleDisabledItemsTags: reads(
    'edmObjectViewModel.singleInstancePropertyTags'
  ),

  /**
   * This component does not have any additional settings. `settings` field is
   * defined to provide editor API compatible with the one expected by the
   * tags input.
   * @virtual optional
   * @type {Object}
   */
  settings: undefined,

  /**
   * @type {Object}
   */
  popoverApi: undefined,

  createSelectorItems(onlyBasic = true) {
    /** @type {Array<VisualEdm.AddPropertySelectorSpec>} */
    const items = [];
    const disabledTagSet = new Set(this.singleDisabledItemsTags);
    for (const [namespace, namespaceSpecs] of Object.entries(allSpecs)) {
      for (const [name, spec] of Object.entries(namespaceSpecs)) {
        if (spec.obj.includes(this.edmObjectType) && (!onlyBasic || spec.basic)) {
          const label = this.t(
              `properties.${namespace}.${name}`, {}, {
                defaultValue: '',
              }
            ) ||
            this.t(
              `properties.${namespace}.${name}.${this.edmObjectType}`, {}, {
                defaultValue: `${namespace}:${name}`,
              }
            );
          const xmlTagName = `${namespace}:${name}`;
          items.push(Object.freeze({
            label,
            name,
            namespace,
            xmlTagName,
            spec,
            disabled: disabledTagSet.has(xmlTagName),
          }));
        }
      }
    }
    return Object.freeze(sortProperties(items, 'visual'));
  },

  repositionPopover() {
    this.popoverApi.reposition();
  },

  actions: {
    /**
     * @param {VisualEdm.AddPropertySelectorSpec} item
     */
    selectProperty(item) {
      this.onPropertyAdd(item);
    },
    cancelSelect() {
      this.onCancel();
    },
  },
});
