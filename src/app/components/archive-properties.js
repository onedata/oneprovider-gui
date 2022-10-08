/**
 * Component for managing properties of archive or create archives.
 * Needs modal-like for layout rendering.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import ArchiveFormEditModel from 'oneprovider-gui/utils/archive-form/edit-model';
import ArchiveFormViewModel from 'oneprovider-gui/utils/archive-form/view-model';
import { and, or } from 'ember-awesome-macros';

/**
 * @typedef {ArchiveFormOptions} ArchivePropertiesTabOptions
 */

export default Component.extend(I18n, {
  classNames: ['archive-properties'],
  i18n: service(),
  globalNotify: service(),
  archiveManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveProperties',

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
   * Instance of modal-like component to render layout (header, body, footer)
   * @virtual
   * @type {Component}
   */
  modal: undefined,

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
  didInsertElement() {
    if (this.options?.editDescription) {
      /** @type {HTMLTextAreaElement} */
      const descriptionInput =
        this.element.querySelector('.description-field .form-control');
      if (descriptionInput) {
        descriptionInput.focus();
        descriptionInput.select();
      }
    }
  },

  /**
   * @override
   */
  willDestroyElement() {
    this._super(...arguments);
    const formModel = this.get('formModel');
    if (formModel) {
      formModel.destroy();
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

  formDataUpdate({ formData = {}, isValid = false } = {}) {
    this.setProperties({
      formData,
      isValid,
    });
  },

  actions: {
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
    close() {
      this.close();
    },
  },
});
