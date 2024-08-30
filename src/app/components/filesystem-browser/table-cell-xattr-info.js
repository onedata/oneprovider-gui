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
import { encodeXattrKey } from 'oneprovider-gui/serializers/file';

export default Component.extend({
  tagName: 'td',
  classNames: ['fb-table-col-xattr', 'multiline', 'hidden-xs'],
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
    const key = encodeXattrKey(this.xattrKey);
    return this.xattrs[key];
  }),

  /**
   * @type {ComputedProperty<string>}
   */
  xattrTextFirstPart: computed('xattrValue', function xattrTextFirstPart() {
    return this.xattrValue?.substr(0, 12);
  }),

  /**
   * @type {ComputedProperty<string>}
   */
  xattrTextSecondPart: computed('xattrValue', function xattrTextSecondPart() {
    return this.xattrValue?.substr(12, 11);
  }),

  click() {
    if (this.xattrValue) {
      this.openXattrModal(this.xattrValue, this.xattrKey);
    }
  },
});
