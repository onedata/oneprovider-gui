/**
 * Form with settings for archive model
 *
 * @module components/archive-form
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

export default Component.extend(I18n, {
  classNames: ['form', 'form-horizontal', 'form-component', 'archive-form'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveForm',

  /**
   * @virtual
   * @type {({ formData: EmberObject, isValid: Boolean }) => any}
   */
  onChange: notImplementedIgnore,

  // FIXME: options param

  /**
   * Set to true, to indicate that form submit is in progress
   * @virtual optional
   * @type {Boolean}
   */
  isSubmitting: false,

  /**
   * @type {ArchiveFormModel}
   */
  formModel: undefined,

  rootFieldGroup: reads('formModel.rootFieldGroup'),

  // FIXME: proxy from model
  /**
   * @virtual
   * @type {PromiseObject<Utils.BrowsableArchive>}
   */
  baseArchiveProxy: undefined,

  // FIXME: move into create model only
  /**
   * @virtual
   * @type {() => PromiseObject<Utils.BrowsableArchive>}
   */
  updateBaseArchiveProxy: undefined,

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
});
