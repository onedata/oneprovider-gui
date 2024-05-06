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
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  classNames: ['visual-edm-validation-error', 'edm-info-row', 'warning'],

  visualEdmValidation: service(),

  /**
   * @virtual
   * @type {EdmValidationMessageViewType}
   */
  viewType: 'visual',

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
   * @type {Array<SafeString>}
   */
  errorMessages: computed('validator.errors', 'viewType', function errorMessages() {
    if (!this.validator) {
      return;
    }
    return this.visualEdmValidation.getErrorMessages(
      this.validator,
      this.viewType
    );
  }),
});
