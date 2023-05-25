/**
 * Exposes HTML with list of items, eg. files to use in tooltip with proper classname.
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed, get } from '@ember/object';
import _ from 'lodash';
import { htmlSafe } from '@ember/string';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { guidFor } from '@ember/object/internals';
import globals from 'onedata-gui-common/utils/globals';
import dom from 'onedata-gui-common/utils/dom';

export default EmberObject.extend(I18n, OwnerInjector, {
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.itemsTooltipContent',

  /**
   * Array of items, eg. files.
   * @type {Array<any>}
   */
  items: undefined,

  /**
   * Sorts items like backend - lexicographical sorting by Unicode chars order.
   *
   * NOTE: Not using Ember's computed sort, because it sorts in other way than standard
   * `Array.sort` method without any sorting function.
   * @type {ComputedProperty<Array<any>>}
   */
  sortedItems: computed('items.@each.name', function sortedItems() {
    return [...this.items].sort();
  }),

  /**
   * Is set to true in `onItemsTooltipShown` callback if UL height exceeds container
   * height, causing overflow and list trim.
   * @type {boolean}
   */
  isOverflown: false,

  tooltipClass: computed(
    'isOverflown',
    function tooltipClass() {
      const resultClasses = ['tooltip-items', 'tooltip-with-tags'];
      if (this.isOverflown) {
        resultClasses.push('item-tooltip-ul-overflows');
      }
      return resultClasses.join(' ');
    }
  ),

  tooltipContent: computed(
    'ulElementId',
    'sortedItems.@each.name',
    'isOverflown',
    function tooltipContent() {
      if (!Array.isArray(this.sortedItems)) {
        return '';
      }
      const itemsHtml = this.sortedItems.map(item =>
        `<li class="tag-item">${get(item, 'name')}</li>`
        // NOTE: span list MUST be separated by spaces, because otherwise it will not
        // wrap elements in Firefox
      ).join(' ');
      const moreContainerHtml = this.isOverflown ?
        `<div class="more-container">${this.t('andMore')}</div>` :
        '';
      return htmlSafe(
        `<ul class="tags-input" id="${this.ulElementId}">` +
        itemsHtml +
        '</ul>' +
        moreContainerHtml
      );
    }
  ),

  ulElementId: computed(function ulElementId() {
    return `items-tooltip-content-ul-${guidFor(this)}`;
  }),

  namesLengthSum: computed('sortedItems.@each.name', function namesLengthSum() {
    return _.sum(this.sortedItems?.map(item => item && get(item, 'name')?.length || 0));
  }),

  onItemsTooltipShown() {
    /** @type {HTMLUListElement} */
    const ulElement = globals.document.getElementById(this.ulElementId);
    if (!ulElement) {
      return;
    }
    const tooltipInner = ulElement.closest('.tooltip-inner');
    const isOverflown = Math.floor(dom.height(ulElement)) > Math.floor(dom.height(
      tooltipInner,
      dom.LayoutBox.ContentBox
    ));
    if (this.isOverflown !== isOverflown) {
      this.set('isOverflown', isOverflown);
    }
  },
});
