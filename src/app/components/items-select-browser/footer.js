/**
 * A footer of layout for `items-select-browser`.
 * 
 * Shows summary of selection with optional constraint validation and action buttons.
 *
 * @module components/items-select-browser/header
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';

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
});
