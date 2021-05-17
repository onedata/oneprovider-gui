/**
 * Component for managing properties of archive or create archives.
 * Needs modal-like for layout rendering.
 *
 * @module components/archive-settings
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { getProperties } from '@ember/object';
import { not, and } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';

export default Component.extend(I18n, {
  classNames: ['archive-settings'],

  i18n: service(),
  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveSettings',

  /**
   * @virtual
   * @type {Function}
   */
  onClose: notImplementedIgnore,

  /**
   * Should be invoked with object suitable for `datasetManager#createArchive` data
   * @virtual
   * @type {(archiveCreateData: Object) => any}
   */
  onSubmit: notImplementedWarn,

  /**
   * @virtual
   * @type {Models.Dataset}
   */
  dataset: undefined,

  /**
   * Instance of modal-like component to render layout (header, body, footer)
   * @virtual
   * @type {Component}
   */
  modal: undefined,

  /**
   * True if submit Promise is pending.
   * @type {Boolean}
   */
  isSubmitting: false,

  /**
   * Data dumped from form root
   * @type {EmberObject}
   */
  formData: Object.freeze({}),

  /**
   * Stores invalid fields list after form value changes
   * @type {Array}
   */
  invalidFields: Object.freeze([]),

  /**
   * Stores validation state of form
   * @type {Boolean}
   */
  isValid: undefined,

  /**
   * True, if submit is available for component state and current form data
   * @type {ComputedProperty<Boolean>}
   */
  canSubmit: and(not('disabled'), 'isValid'),

  async submit() {
    const {
      formData,
      canSubmit,
      onSubmit,
    } = this.getProperties('formData', 'canSubmit', 'onSubmit');
    this.set('isSubmitting', true);
    try {
      if (canSubmit) {
        const archiveCreateData = this.generateArchiveData(formData);
        return onSubmit(archiveCreateData);
      }
    } finally {
      this.set('isSubmitting', false);
    }
  },

  generateArchiveData(formData) {
    if (formData) {
      const {
        config,
        description,
        preservedCallback,
        purgedCallback,
      } = getProperties(
        formData,
        'config',
        'description',
        'preservedCallback',
        'purgedCallback'
      );
      const rawConfig = getProperties(
        config,
        'incremental',
        'layout',
        'includeDip',
      );
      return {
        config: rawConfig,
        description,
        preservedCallback,
        purgedCallback,
      };
    } else {
      console.warn(
        'component:archive-settings#generateArchiveData: empty form data'
      );
      return {};
    }
  },

  close() {
    this.get('onClose')();
  },

  actions: {
    async submit() {
      try {
        await this.submit();
        this.close();
      } catch (error) {
        this.get('globalNotify').backendError(this.t('creatingArchive'), error);
      }
    },
    formDataUpdate({ formData = {}, isValid = false, invalidFields = [] } = {}) {
      this.setProperties({
        formData,
        isValid,
        invalidFields,
      });
    },
    close() {
      this.close();
    },
  },
});
