/**
 * Renders table cell with specific xattr info
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { computed } from '@ember/object';
import Component from '@ember/component';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';
import { reads } from '@ember/object/computed';

export default Component.extend({
  tagName: 'td',
  classNames: ['fb-table-col-xattr', 'multiline', 'hidden-xs'],

  attributeBindings: [
    'style',
  ],

  /**
   * @virtual
   * @type {string}
   */
  style: undefined,

  /**
   * @virtual
   * @type {string}
   */
  columnInfo: undefined,

  /**
   * @virtual
   * @type {string}
   */
  xattrs: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  openXattrModal: notImplementedWarn,

  /**
   * @type {ComputedProperty<String>}
   */
  xattrKey: reads('columnInfo.xattrKey'),

  /**
   * @type {ComputedProperty<String>}
   */
  xattrValue: computed('xattrs', 'xattrKey', function xattrValue() {
    const key = this.xattrKey.replace('.', '-');
    return this.xattrs[key];
  }),

  /**
   * @type {ComputedProperty<String>}
   */
  xattrTextFirstPart: computed('xattrValue', function xattrTextFirstPart() {
    return this.xattrValue?.substr(0, 12);
  }),

  /**
   * @type {ComputedProperty<String>}
   */
  xattrTextSecondPart: computed('xattrValue', function xattrTextSecondPart() {
    return this.xattrValue?.substr(12, 11);
  }),

  click: function click() {
    if (this.xattrValue) {
      this.openXattrModal(this.xattrValue, this.xattrKey);
    }
  },
});
