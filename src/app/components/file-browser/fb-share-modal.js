/**
 * Modal which can create a share or show link to it
 *
 * @module components/file-browser/fb-share-modal
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { computed, get, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
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
import { resolve, reject } from 'rsvp';
import backendNameRegexp from 'onedata-gui-common/utils/backend-name-regexp';
import backendifyName, {
  minLength as shareNameMin,
  maxLength as shareNameMax,
} from 'onedata-gui-common/utils/backendify-name';
import { next } from '@ember/runloop';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import isPosixViewForbidden from 'oneprovider-gui/utils/is-posix-view-forbidden';

export default Component.extend(
  I18n,
  createDataProxyMixin('shares'), {
    shareManager: service(),
    globalNotify: service(),
    i18n: service(),

    /**
     * @override
     */
    i18nPrefix: 'components.fileBrowser.fbShareModal',

    /**
     * @virtual
     */
    file: undefined,

    /**
     * @virtual
     */
    onHide: notImplementedReject,

    /**
     * @virtual
     * @type {Function}
     */
    getShareUrl: notImplementedThrow,

    open: false,

    isSaving: false,

    newShareName: '',

    /**
     * If true, the create new share button can be enabled.
     * Should be injected with space prvilege (space_manage_shares).
     * @type {Boolean}
     */
    managePrivilege: true,

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

    inputFocusObserver: observer(
      'mode',
      'sharesProxy.isFulfilled',
      function inputFocusObserver() {
        const sharesProxy = this.get('sharesProxy');
        const contentWait = get(sharesProxy, 'isFulfilled') ?
          resolve() : sharesProxy;
        contentWait.then(() => {
          if (this.get('mode') === 'new') {
            next(() => {
              const inputElement = this.getInputElement();
              if (inputElement) {
                inputElement.focus();
              }
            });
          }
        });
      }
    ),

    isViewForOtherForbidden: computed(
      'file.{type,posixPermissions}',
      function isViewForOtherForbidden() {
        const file = this.get('file');
        const octalNumber = 2;
        return isPosixViewForbidden(file, octalNumber);
      }
    ),

    /**
     * @override
     */
    fetchShares() {
      return this.get('file').reload()
        .then(file => {
          if (get(file, 'sharesCount')) {
            return get(file, 'shareRecords')
              .then(shares => shares.reload());
          } else {
            return null;
          }
        });
    },

    getInputElement() {
      return document.getElementById(this.get('inputId'));
    },

    setInitialShareName() {
      const fileName = this.get('file.originalName');
      this.set('newShareName', backendifyName(fileName));
    },

    actions: {
      submitNew() {
        if (this.get('validationError')) {
          return reject();
        }
        const {
          shareManager,
          globalNotify,
          file,
          newShareName: name,
        } = this.getProperties('shareManager', 'globalNotify', 'file', 'newShareName');
        this.set('isSaving', true);
        return shareManager.createShare(file, name.trim())
          .then(() => this.updateSharesProxy())
          .catch(error => {
            globalNotify.backendError(this.t('creatingShare'), error);
            throw error;
          })
          .finally(() => safeExec(this, 'setProperties', {
            isSaving: false,
          }));
      },
      onShow() {
        this.setInitialShareName();
        this.updateSharesProxy().then(() => {
          this.inputFocusObserver();
        });
      },
      onHide() {
        this.set('newShareName', '');
        this.get('onHide')();
      },
    },
  }
);
