/**
 * Text with joined error messages for EDM validation error components.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { capitalize } from '@ember/string';
import { htmlSafe } from '@ember/string';

export default Component.extend({
  tagName: 'span',
  classNames: ['visual-edm-validation-error-text'],

  visualEdmValidation: service(),

  /**
   * @virtual
   * @type {EdmValidationMessageViewType}
   */
  viewType: 'visual',

  /**
   * @virtual
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
  errorMessages: computed(
    'text',
    'validator.errors',
    'viewType',
    function errorMessages() {
      if (!this.validator) {
        return;
      }
      const messages = this.visualEdmValidation.getErrorMessages(
        this.validator,
        this.viewType
      );
      if (!this.text && messages[0]) {
        messages[0] = htmlSafe(capitalize(String(messages[0])));
      }
      return messages;
    }
  ),
});
