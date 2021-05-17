import Component from '@ember/component';
import { computed, getProperties } from '@ember/object';
import FormFieldsGroup from 'onedata-gui-common/utils/form-component/form-fields-group';
import TextField from 'onedata-gui-common/utils/form-component/text-field';
import RadioField from 'onedata-gui-common/utils/form-component/radio-field';
import ToggleField from 'onedata-gui-common/utils/form-component/toggle-field';
import FormFieldsRootGroup from 'onedata-gui-common/utils/form-component/form-fields-root-group';
import { tag, not, or, and } from 'ember-awesome-macros';
import { scheduleOnce } from '@ember/runloop';
import { reads } from '@ember/object/computed';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import fileManager from 'oneprovider-gui/services/production/file-manager';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';

export default Component.extend(I18n, {
  i18n: service(),
  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveSettings',

  /**
   * @virtual
   */
  onClose: notImplementedIgnore,

  /**
   * @virtual
   */
  onSubmit: notImplementedWarn,

  /**
   * @virtual
   */
  dataset: undefined,

  /**
   * @virtual
   */
  modal: undefined,

  // FIXME:
  isSubmitting: false,

  formData: Object.freeze({}),

  invalidFields: Object.freeze([]),

  isValid: undefined,

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
