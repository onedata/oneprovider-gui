/**
 * Logic and state for `archive-properties` component.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject from '@ember/object';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import ArchiveFormEditModel from 'oneprovider-gui/utils/archive-form/edit-model';
import ArchiveFormViewModel from 'oneprovider-gui/utils/archive-form/view-model';
import { and, or } from 'ember-awesome-macros';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { Promise } from 'rsvp';
import sleep from 'onedata-gui-common/utils/sleep';
import waitForRender from 'onedata-gui-common/utils/wait-for-render';

/**
 * @typedef {ArchiveFormOptions} ArchivePropertiesTabOptions
 */

const mixins = [
  I18n,
  OwnerInjector,
];

export default EmberObject.extend(...mixins, {
  i18n: service(),
  globalNotify: service(),
  archiveManager: service(),
  modalManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.archivePropertiesViewModel',

  /**
   * @virtual
   * @type {Utils.BrowsableArchive}
   */
  browsableArchive: undefined,

  /**
   * @virtual
   * @type {Model.Space}
   */
  space: undefined,

  /**
   * @virtual optional
   * @type {HTMLElement}
   */
  element: undefined,

  /**
   * @virtual optional
   * @type {ArchivePropertiesTabOptions}
   */
  options: undefined,

  //#region state

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
   * Stores validation state of form
   * @type {Boolean}
   */
  isValid: undefined,

  //#endregion

  /**
   * True, if submit is available for component state and current form data
   * @type {ComputedProperty<Boolean>}
   */
  canSubmit: reads('hasEditPrivileges', 'isValid'),

  hasEditPrivileges: and(
    'space.privileges.manageDatasets',
    'space.privileges.createArchives'
  ),

  isEditable: reads('hasEditPrivileges'),

  areSubmitButtonsVisible: or('options.editDescription', 'isModified'),

  isModified: reads('formModel.isModified'),

  /**
   * @type {ComputedProperty<Utils.ArchiveFrom.ViewModel|Utils.ArchiveFrom.EditModel>}
   */
  formModel: computed(function formModel() {
    const {
      browsableArchive,
      isEditable,
    } = this.getProperties(
      'browsableArchive',
      'isEditable',
    );
    let ModelClass = isEditable ? ArchiveFormEditModel : ArchiveFormViewModel;
    const modelOptions = {
      ownerSource: this,
      archive: browsableArchive,
      checkUnmodifiedDescription: true,
    };
    if (isEditable) {
      modelOptions.onChange = this.formDataUpdate.bind(this);
      ModelClass = ModelClass.extend({
        disabled: reads('ownerSource.isSubmitting'),
      });
    }
    return ModelClass.create(modelOptions);
  }),

  /**
   * @override
   */
  destroy() {
    try {
      this.formModel?.destroy();
    } finally {
      this._super(...arguments);
    }
  },

  async modifyArchive() {
    const {
      archiveManager,
      browsableArchive,
      formData,
      canSubmit,
    } = this.getProperties(
      'archiveManager',
      'browsableArchive',
      'formData',
      'canSubmit',
    );
    this.set('isSubmitting', true);
    try {
      if (canSubmit) {
        const archiveModifyData = await this.generateArchiveModifyData(formData);
        return await archiveManager.modifyArchive(browsableArchive, archiveModifyData);
      }
    } finally {
      this.set('isSubmitting', false);
    }
  },

  async generateArchiveModifyData(formData) {
    if (formData) {
      const description = get(formData, 'description');
      return {
        description,
      };
    } else {
      console.warn(
        'generateArchiveData: empty form data'
      );
      return {};
    }
  },

  discard() {
    this.formModel.reset();
  },

  async submit() {
    try {
      await this.modifyArchive();
      this.formModel.onSubmitted();
    } catch (error) {
      this.globalNotify.backendError(this.t('modifyingArchive'), error);
    }
  },

  async checkClose() {
    if (this.isModified) {
      return this.handleUnsavedChanges();
    } else {
      return true;
    }
  },

  /**
   * True if the view can be safely closed without losing changes.
   * @returns {Promise<boolean>}
   */
  async handleUnsavedChanges() {
    return await new Promise(resolve => {
      this.modalManager.show('unsaved-changes-question-modal', {
        onSubmit: async (data) => {
          if (data.shouldSaveChanges) {
            try {
              await this.submit();
              resolve(true);
            } catch (error) {
              resolve(false);
            }
          } else {
            this.discard();
            resolve(true);
          }
        },
        onHide() {
          resolve(false);
        },
      });
    });
  },

  formDataUpdate({ formData = {}, isValid = false } = {}) {
    this.setProperties({
      formData,
      isValid,
    });
  },

  selectDescription() {
    if (!this.element || this.isDestroyed) {
      return;
    }
    /** @type {HTMLTextAreaElement} */
    const descriptionInput =
      this.element.querySelector('.description-field .form-control');
    if (descriptionInput) {
      descriptionInput.focus();
      descriptionInput.select();
    }
  },

  async onShown() {
    if (this.options?.editDescription) {
      // 0.2s from .modal-content-overlay style transition time
      await sleep(200);
      await waitForRender();
      this.selectDescription();
    }
  },
});
