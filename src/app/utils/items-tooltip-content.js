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

export default EmberObject.extend({
  /**
   * Array of items, eg. files.
   * @type {Array<any>}
   */
  items: undefined,

  tooltipClass: computed(
    'isHugeMultiText',
    function tooltipClass() {
      const resultClasses = ['tooltip-items', 'tooltip-with-tags'];
      if (this.isHugeMultiText) {
        resultClasses.push('huge-content');
      }
      return resultClasses.join(' ');
    }
  ),

  tooltipContent: computed('items.@each.name', function tooltipContent() {
    return htmlSafe(
      '<ul class="tags-input">' +
      this.items?.map(item =>
        `<li class="tag-item">${get(item, 'name')}</li>`
        // NOTE: span list MUST be separated by spaces, because otherwise it will not
        // wrap elements in Firefox
      ).join(' ') +
      '</ul>'
    );
  }),

  isHugeMultiText: computed('items.@each.name', function isHugeMultiText() {
    return _.sum(this.items?.map(item => get(item, 'name').length)) > 2750;
  }),
});
