/**
 * Modal which can create a share or show link to it
 * 
 * @module components/file-browser/fb-share-modal
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import {
  promise,
  and,
  or,
  conditional,
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
import { reject } from 'rsvp';
import backendNameRegexp from 'onedata-gui-common/utils/backend-name-regexp';
import backendifyName, {
  minLength as shareNameMin,
  maxLength as shareNameMax,
} from 'onedata-gui-common/utils/backendify-name';

export default Component.extend(
  I18n,
  createDataProxyMixin('shares'), {
    shareManager: service(),
    globalNotify: service(),

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

    addAnotherOneMode: false,

    submitNewDisabled: or(
      notEmpty('validationError'),
      'isSaving',
      lt(string.length(string.trim('newShareName')), raw(2))
    ),

    modeProxy: promise.object(computed('sharesProxy.content', function modeProxy() {
      return this.get('sharesProxy').then(share => share ? 'show' : 'new');
    })),

    mode: conditional(
      'addAnotherOneMode',
      raw('new'),
      'modeProxy.content',
    ),

    inputId: computed('elementId', function inputId() {
      return `${this.elementId}-name-input`;
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

    validationErrorMessage: computed('validationError', function validationErrorMessage() {
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
    }),

    shareCount: reads('sharesProxy.content.length'),

    publicShareUrl: reads('share.publicUrl'),

    /**
     * @override
     */
    fetchShares() {
      return this.get('file').reload()
        .then(file => {
          if (file.belongsTo('shareList').id()) {
            return get(file, 'shareList')
              .then(shareList => shareList.reload())
              .then(shareList => get(shareList, 'list'));
          } else {
            return null;
          }
        });
    },

    setInitialShareName() {
      const fileName = this.get('file.name');
      this.set('newShareName', backendifyName(fileName));
    },

    actions: {
      getShareUrl() {
        return this.get('getShareUrl')(...arguments);
      },
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
            addAnotherOneMode: false,
          }));
      },
      onShow() {
        this.setInitialShareName();
        return this.updateSharesProxy();
      },
      onHide() {
        this.set('newShareName', '');
        this.get('onHide')();
      },
    },
  }
);
