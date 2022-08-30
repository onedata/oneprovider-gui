/**
 * Create new share modal.
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import {
  and,
  or,
  raw,
  string,
  lt,
  gt,
  notEmpty,
  not,
} from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import backendNameRegexp from 'onedata-gui-common/utils/backend-name-regexp';
import backendifyName, {
  minLength as shareNameMin,
  maxLength as shareNameMax,
} from 'onedata-gui-common/utils/backendify-name';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import isPosixViewForbidden from 'oneprovider-gui/utils/is-posix-view-forbidden';
import waitForRender from 'onedata-gui-common/utils/wait-for-render';

/**
 * @typedef {Object} ShareModalOptions
 * @property {Model.File} file
 * @property {() => void} onClose
 */

export default Component.extend(I18n, {
  tagName: '',

  i18n: service(),
  shareManager: service(),
  globalNotify: service(),
  modalManager: service(),

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

  //#region state

  isSaving: false,

  newShareName: '',

  //#endregion

  /**
   * If true, the create new share button can be enabled.
   * Should be injected with space prvilege (space_manage_shares).
   * @type {Boolean}
   */
  managePrivilege: true,

  /**
   * @type {ComputedProperty<Models.File>}
   */
  file: reads('modalOptions.file'),

  /**
   * @type {ComputedProperty<() => void>}
   */
  onSubmitted: reads('modalOptions.onSubmitted'),

  submitNewDisabled: or(
    notEmpty('validationError'),
    'isSaving',
    lt(string.length(string.trim('newShareName')), raw(2))
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

  nameIsValid: string.match('newShareName', raw(backendNameRegexp)),

  validationError: or(
    and(
      lt('newShareName.length', raw(shareNameMin)),
      raw('nameTooShort')
    ),
    and(
      gt('newShareName.length', raw(shareNameMax)),
      raw('nameTooLong')
    ),
    and(
      not('nameIsValid'),
      raw('regexp')
    ),
    null,
  ),

  validationErrorMessage: computed(
    'validationError',
    function validationErrorMessage() {
      const validationError = this.get('validationError');
      if (validationError) {
        let interpolations;
        switch (validationError) {
          case 'nameTooShort':
            interpolations = { length: shareNameMin };
            break;
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

  isViewForOtherForbidden: computed(
    'file.{type,posixPermissions}',
    function isViewForOtherForbidden() {
      const file = this.get('file');
      const octalNumber = 2;
      return isPosixViewForbidden(file, octalNumber);
    }
  ),

  init() {
    this._super(...arguments);
    console.log('share modal created');
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
    return document.getElementById(this.inputId);
  },

  setInitialShareName() {
    const fileName = this.get('file.originalName');
    this.set('newShareName', backendifyName(fileName));
  },

  close() {
    this.set('newShareName', '');
    this.modalManager.hide(this.modalId);
  },

  actions: {
    async submitNew() {
      if (this.validationError) {
        return;
      }
      const {
        shareManager,
        globalNotify,
        file,
        newShareName: name,
      } = this.getProperties('shareManager', 'globalNotify', 'file', 'newShareName');
      this.set('isSaving', true);
      try {
        try {
          await shareManager.createShare(file, name.trim());
        } catch (error) {
          globalNotify.backendError(this.t('creatingShare'), error);
          throw error;
        }
        try {
          await file.reload();
          await file.hasMany('shareRecords');
        } finally {
          this.onSubmitted?.();
          this.close();
        }
      } finally {
        safeExec(this, 'set', 'isSaving', false);
      }
    },
    onHide() {
      this.close();
    },
  },
});
