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
import { computed, observer, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import {
  promise,
  or,
  conditional,
  raw,
  string,
  lt,
  gt,
  notEmpty,
} from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import computedT from 'onedata-gui-common/utils/computed-t';
import { reject } from 'rsvp';

const shareNameLimit = 50;

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

    editValue: '',

    addAnotherOneMode: false,

    submitNewDisabled: or(
      notEmpty('validationError'),
      'isSaving',
      lt(string.length(string.trim('editValue')), raw(2))
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

    validationError: conditional(
      gt('editValue.length', raw(shareNameLimit)),
      computedT('validations.nameTooLong', { length: shareNameLimit }),
      raw(''),
    ),

    shareCount: reads('sharesProxy.content.length'),

    publicShareUrl: reads('share.publicUrl'),

    setDefaultName: observer('file', function setDefaultName() {
      this.set('editValue', this.get('file.name') || '');
    }),

    init() {
      this._super(...arguments);
      this.setDefaultName();
    },

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
          editValue: name,
        } = this.getProperties('shareManager', 'globalNotify', 'file', 'editValue');
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
        return this.updateSharesProxy();
      },
      onHide() {
        this.get('onHide')();
      },
    },
  }
);
