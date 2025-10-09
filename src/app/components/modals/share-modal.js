/**
 * Create new share modal.
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import {
  or,
  notEmpty,
} from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import I18n from 'onedata-gui-common/mixins/i18n';
import {
  maxLength as shareNameMax,
} from 'onedata-gui-common/utils/backendify-name';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import waitForRender from 'onedata-gui-common/utils/wait-for-render';
import globals from 'onedata-gui-common/utils/globals';
import FileConsumerMixin, { computedSingleUsedFileGri } from 'oneprovider-gui/mixins/file-consumer';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';
import { LegacyFileType } from 'onedata-gui-common/utils/file';
import { isValidFilename } from 'onedata-gui-common/utils/file';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';

/**
 * @typedef {Object} ShareModalOptions
 * @property {Model.File} file
 * @property {() => void} onClose
 */

/**
 * @typedef {'empty'|'nameTooLong'|'nameIsValid'} ShareNameValidationError
 */

const mixins = [
  I18n,
  FileConsumerMixin,
];

export default Component.extend(...mixins, {
  tagName: '',

  i18n: service(),
  shareManager: service(),
  globalNotify: service(),
  modalManager: service(),
  handleManager: service(),
  appProxy: service(),
  errorExtractor: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.modals.shareModal',

  /**
   * @virtual
   * @type {string}
   */
  modalId: undefined,

  /**
   * @virtual
   * @type {ShareModalOptions}
   */
  modalOptions: undefined,

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  fileRequirements: computed('file', function fileRequirements() {
    if (!this.file) {
      return [];
    }
    return [
      new FileRequirement({
        fileGri: this.get('file.id'),
        properties: ['shareRecords'],
      }),
    ];
  }),

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  usedFileGris: computedSingleUsedFileGri('file'),

  //#region state

  isSaving: false,

  newShareName: '',

  isPublishCheckboxChecked: false,

  //#endregion

  /**
   * If true, the create new share button can be enabled.
   * Should be injected with space privilege (space_manage_shares).
   * @type {Boolean}
   */
  managePrivilege: true,

  /**
   * @type {ComputedProperty<Models.File>}
   */
  file: reads('modalOptions.file'),

  /**
   * @type {ComputedProperty<(share: Models.Share, isPublishing: boolean) => void>}
   */
  onSubmitted: reads('modalOptions.onSubmitted'),

  submitNewDisabled: or(
    notEmpty('validationError'),
    'isSaving'
  ),

  inputId: computed('elementId', function inputId() {
    return `${this.elementId}-name-input`;
  }),

  noManageHint: computed(function noManageHint() {
    return insufficientPrivilegesMessage({
      i18n: this.get('i18n'),
      modelName: 'space',
      privilegeFlag: 'space_manage_shares',
    });
  }),

  /**
   * @type {ComputedProperty<ShareNameValidationError|undefined>}
   */
  validationError: computed('newShareName.length', function validationError() {
    const name = this.newShareName;
    const nameLength = name.length;
    if (nameLength == null) {
      return;
    }
    if (nameLength === 0) {
      return 'empty';
    }
    if (nameLength > shareNameMax) {
      return 'nameTooLong';
    }
    if (!isValidFilename(name)) {
      return 'regexp';
    }
  }),

  validationErrorMessage: computed(
    'validationError',
    function validationErrorMessage() {
      const validationError = this.get('validationError');
      if (validationError) {
        let interpolations;
        switch (validationError) {
          case 'nameTooLong':
            interpolations = { length: shareNameMax };
            break;
          default:
            interpolations = {};
            break;
        }
        return this.t(`validations.${validationError}`, interpolations);
      }
    }
  ),

  shareCount: reads('sharesProxy.content.length'),

  publicShareUrl: reads('share.publicUrl'),

  isPublishDisabled: computed(
    'hasAnyHandleService',
    'isSaving',
    function isPublishDisabled() {
      return !this.hasAnyHandleService || this.isSaving;
    }
  ),

  publishTip: computed(
    'hasAnyHandleService',
    function publishTip() {
      return this.t(
        this.handleServiceCountProxy.isPending || this.hasAnyHandleService ?
        'publishTip' :
        'publishImpossibleTip'
      );
    },
  ),

  errorMessage: computed('handleServiceCountProxy', function errorMessage() {
    if (this.handleServiceCountProxy.isFulfilled) {
      return null;
    }
    return this.errorExtractor.getMessage(this.handleServiceCountProxy.reason).message;
  }),

  handleServiceCountProxy: computed(function handleServiceCountProxy() {
    return promiseObject(this.handleManager.getHandleServiceCount());
  }),

  hasAnyHandleService: computed(
    'handleServiceCountProxy.content',
    function hasAnyHandleService() {
      return this.handleServiceCountProxy.content > 0;
    }
  ),

  init() {
    this._super(...arguments);
    waitForRender().then(() => {
      this.setInitialShareName();
      this.focusInput();
    });
  },

  focusInput() {
    const inputElement = this.getInputElement();
    if (inputElement) {
      inputElement.focus();
    }
  },

  getInputElement() {
    return globals.document.getElementById(this.inputId);
  },

  setInitialShareName() {
    this.set('newShareName', this.createInitialShareName(this.file));
  },

  /**
   * @param {Models.File} file
   * @returns {string}
   */
  createInitialShareName(file) {
    /** @type {string} */
    let name = file.originalName;
    if (file.type !== LegacyFileType.Directory) {
      name = name.match(/(.*)\..*/)?.[1] ?? name;
    }
    return name;
  },

  close() {
    this.set('newShareName', '');
    this.modalManager.hide(this.modalId);
  },

  async submitNew() {
    if (this.validationError) {
      return;
    }
    const {
      shareManager,
      globalNotify,
      file,
      newShareName: name,
    } = this;
    this.set('isSaving', true);
    try {
      let share;
      try {
        share = await shareManager.createShare(file, name.trim());
        this.appProxy.callParent('reloadShareList');
      } catch (error) {
        globalNotify.backendError(this.t('creatingShare'), error);
        throw error;
      }
      try {
        await file.reload();
        await file.hasMany('shareRecords');
      } finally {
        this.onSubmitted?.(share, this.isPublishCheckboxChecked);
        this.close();
      }
    } finally {
      safeExec(this, 'set', 'isSaving', false);
    }
  },

  actions: {
    async submitNew() {
      return await this.submitNew();
    },
    onHide() {
      this.close();
    },
    togglePublishCheckbox() {
      if (!this.isPublishDisabled) {
        this.set('isPublishCheckboxChecked', !this.isPublishCheckboxChecked);
      }
    },
  },
});
