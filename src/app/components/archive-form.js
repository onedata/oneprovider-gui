/**
 * Form with settings for archive model
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get } from '@ember/object';
import { reads } from '@ember/object/computed';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

/**
 * @typedef {Object} ArchiveFormOptions
 * @property {boolean} focusDescription
 */

export default Component.extend(I18n, {
  classNames: ['form', 'form-horizontal', 'form-component', 'archive-form'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveForm',

  /**
   * @virtual
   * @type {Utils.ArchiveForm.BaseModel}
   */
  formModel: undefined,

  /**
   * @virtual optional
   * @type {ArchiveFormOptions}
   */
  options: Object.freeze({
    focusDescription: false,
  }),

  /**
   * Set to true, to indicate that form submit is in progress
   * @virtual optional
   * @type {Boolean}
   */
  isSubmitting: false,

  /**
   * @virtual
   * @type {({ formData: EmberObject, isValid: Boolean }) => any}
   */
  onChange: notImplementedIgnore,

  rootFieldGroup: reads('formModel.rootFieldGroup'),

  /**
   * @override
   */
  didInsertElement() {
    this._super(...arguments);
    if (this.get('options.focusDescription')) {
      /** @type {HTMLElement} */
      const descriptionField = this.get('element').querySelector('.description-field');
      if (descriptionField) {
        descriptionField.focus();
      }
    }
  },

  /**
   * @override
   */
  willDestroyElement() {
    this._super(...arguments);
    this.get('formModel').destroy();
  },

  notifyAboutChange() {
    safeExec(this, () => {
      const {
        rootFieldGroup,
        onChange,
      } = this.getProperties('rootFieldGroup', 'onChange');

      const isValid = get(rootFieldGroup, 'isValid');

      onChange({
        formData: rootFieldGroup.dumpValue(),
        isValid,
      });
    });
  },
});
