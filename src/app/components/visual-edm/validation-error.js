/**
 * Information about validation error for any EDM element.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @copyright (C) 2026 Onedata (onedata.org)
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { guidFor } from '@ember/object/internals';

export default Component.extend(I18n, {
  classNames: ['visual-edm-validation-error', 'edm-info-row', 'warning'],

  /** @override */
  i18nPrefix: 'components.visualEdm.validationError',

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
   * State of the ignore validation toggle.
   * @virtual optional
   * @type {boolean}
   */
  isValidationIgnored: false,

  /**
   * If set to true, displays options link with popover, which allows to set validation
   * ignoring.
   * @virtual optional
   * @type {boolean}
   */
  isShowingIgnoreOption: false,

  /**
   * Callback to update `isValidationIgnored` value up.
   * @virtual optional
   * @type {(value: boolean) => void}
   */
  onValidationIgnoredChange: undefined,

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

  advancedOptionsButtonId: computed(function advancedOptionsButtonId() {
    return guidFor(this) + '-advanced-options-button';
  }),

  actions: {
    changeValidationIgnored(value) {
      this.onValidationIgnoredChange(value);
    },
  },
});
