/**
 * A footer of layout for `items-select-browser`.
 *
 * Shows summary of selection with optional constraint validation and action buttons.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';
import ItemsTooltipContent from 'oneprovider-gui/utils/items-tooltip-content';

export default Component.extend(I18n, {
  classNames: ['items-select-browser-footer'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.itemsSelectBrowser.footer',

  /**
   * @virtual
   * @type {Array<Object>} array of items (file-like)
   */
  selectedItems: undefined,

  /**
   * @virtual
   * @type {Boolean}
   */
  submitDisabled: undefined,

  /**
   * @virtual
   * @type {String}
   */
  submitLabel: undefined,

  /**
   * @virtual optional
   */
  validationError: undefined,

  /**
   * @virtual
   */
  onCancel: notImplementedIgnore,

  /**
   * @virtual
   */
  onSubmit: notImplementedIgnore,

  selectedCount: reads('selectedItems.length'),

  itemsSelectedText: computed('selectedCount', function itemsSelectedText() {
    const selectedCount = this.get('selectedCount');
    let key;
    if (selectedCount && typeof selectedCount === 'number' && selectedCount > 0) {
      if (selectedCount === 1) {
        key = 'single';
      } else {
        key = 'multi';
      }
    } else {
      key = 'none';
    }
    return this.t(`itemsSelected.${key}`, {
      count: selectedCount,
    });
  }),

  init() {
    this._super(...arguments);
    const itemsTooltipContent = ItemsTooltipContent.extend({
      items: reads('component.selectedItems'),
    }).create({
      ownerSource: this,
      component: this,
    });
    this.set('itemsTooltipContent', itemsTooltipContent);
  },

  actions: {
    onItemsTooltipShown() {
      this.itemsTooltipContent.onItemsTooltipShown(...arguments);
    },
  },
});
