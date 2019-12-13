/**
 * FIXME: description
 * 
 * @module components/db-view-modal/tab-general
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['tab-function'],
  classNameBindings: ['tabFunctionClass'],

  i18nPrefix: 'components.dbViewModal.tabFunction',

  /**
   * @virtual
   */
  functionString: undefined,

  /**
   * @virtual
   * One of: map, reduce
   * @type {string}
   */
  functionType: undefined,

  tabFunctionClass: computed('functionType', function tabFunctionClass() {
    return `tab-function-${this.get('functionType')}`;
  }),

  formattedSource: computed('functionString', function formattedSource() {
    const functionString = this.get('functionString');
    if (functionString) {
      const unescaped = functionString
        .replace(/\\\\/g, '\\')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, '\'')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\v/g, '\v')
        .replace(/\\0/g, '\f')
        .replace(/\\r/g, '\r');
      return window.js_beautify(unescaped);
    }
  }),
});
