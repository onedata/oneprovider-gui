/**
 * Content of db-view-modal for showing source of one of Database View (Index) functions
 *
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import unescapeBackendFunction from 'oneprovider-gui/utils/unescape-backend-function';
import JsBeautify from 'js-beautify';

export default Component.extend(I18n, {
  classNames: ['tab-function'],
  classNameBindings: ['tabFunctionClass'],

  i18nPrefix: 'components.dbViewModal.tabFunction',

  /**
   * @virtual
   * Text of the function with escaped chars from backend.
   * See `formattedSource` computed property for unescaping function.
   * @type {string}
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
      const unescaped = unescapeBackendFunction(functionString);
      return JsBeautify.js_beautify(unescaped);
    }
  }),
});
