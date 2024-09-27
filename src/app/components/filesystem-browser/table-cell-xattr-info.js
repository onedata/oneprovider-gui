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
import { reads, gt } from '@ember/object/computed';
import stringifyXattrValue from 'oneprovider-gui/utils/stringify-xattr-value';

export default Component.extend({
  tagName: 'td',
  classNames: ['fb-table-col-xattr', 'multiline', 'hidden-xs'],
  classNameBindings: [
    'xattrValue:clickable',
  ],
  attributeBindings: ['style'],

  /**
   * @virtual
   * @type {string}
   */
  style: undefined,

  /**
   * @virtual
   * @type {ColumnProperties}
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
   * @type {ComputedProperty<string>}
   */
  xattrKey: reads('columnInfo.xattrKey'),

  /**
   * @type {ComputedProperty<string>}
   */
  xattrValue: computed('xattrs', 'xattrKey', function xattrValue() {
    return stringifyXattrValue(this.xattrs[this.xattrKey]);
  }),

  /**
   * @type {ComputedProperty<string>}
   */
  xattrTextFirstPart: computed('xattrValue', function xattrTextFirstPart() {
    return this.xattrValue?.substring(0, 12);
  }),

  /**
   * @type {ComputedProperty<string>}
   */
  xattrTextSecondPart: computed('xattrValue', function xattrTextSecondPart() {
    return this.xattrValue?.substring(12, 23);
  }),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isEllipsisShown: gt('xattrValue.length', 23),

  click() {
    if (this.xattrValue) {
      this.openXattrModal(this.xattrValue, this.xattrKey);
    }
  },
});
