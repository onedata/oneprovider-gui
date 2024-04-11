/**
 * Information about validation error for any EDM element.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { computed } from '@ember/object';

export default Component.extend(I18n, {
  classNames: ['visual-edm-validation-error', 'edm-info-row', 'warning'],

  /**
   * @type {EdmMetadataValidator|EdmObjectValidator|EdmPropertyValidator}
   */
  validator: undefined,

  /**
   * @virtual
   * @type {string|SafeString}
   */
  text: undefined,

  /**
   * @type {Array<string>}
   */
  errorMessages: computed('validator.errors', function errorMessages() {
    return this.validator?.errors?.map(error => error.toString());
  }),
});
