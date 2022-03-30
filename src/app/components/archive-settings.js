/**
 * Component for managing properties of archive or create archives.
 * Needs modal-like for layout rendering.
 *
 * @module components/archive-settings
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, getProperties } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import ArchiveFormEditModel from 'oneprovider-gui/utils/archive-form/edit-model';
import ArchiveFormViewModel from 'oneprovider-gui/utils/archive-form/view-model';
import { and } from 'ember-awesome-macros';

export default Component.extend(I18n, {
  // do not use tag, because the layout is built by `modal` property
  // for styling, use: `archive-settings-part` class
  tagName: '',

  i18n: service(),
  globalNotify: service(),
  archiveManager: service(),

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

  isModified: reads('formModel.isModified'),

  formModel: computed(function formModel() {
    const {
      browsableArchive,
      isEditable,
    } = this.getProperties(
      'browsableArchive',
      'isEditable',
    );
    const ModelClass = isEditable ? ArchiveFormEditModel : ArchiveFormViewModel;
    const options = {
      ownerSource: this,
      archive: browsableArchive,
    };
    if (isEditable) {
      options.onChange = this.formDataUpdate.bind(this);
    }
    return ModelClass.create(options);
  }),

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
      const {
        description,
        preservedCallback,
        purgedCallback,
      } = getProperties(
        formData,
        'description',
        'preservedCallback',
        'purgedCallback'
      );

      return {
        description,
        preservedCallback,
        purgedCallback,
      };
    } else {
      console.warn(
        'generateArchiveData: empty form data'
      );
      return {};
    }
  },

  close() {
    this.get('onClose')();
  },

  formDataUpdate({ formData = {}, isValid = false } = {}) {
    this.setProperties({
      formData,
      isValid,
    });
  },

  actions: {
    async submit() {
      try {
        await this.modifyArchive();
        this.close();
      } catch (error) {
        this.get('globalNotify').backendError(this.t('modifyingArchive'), error);
      }
    },
    close() {
      this.close();
    },
  },
});
