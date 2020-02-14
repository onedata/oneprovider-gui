/**
 * Shows modal allowing to publish share with one of handle services.
 *
 * @module components/space-shares/publish-modal
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get } from '@ember/object';
import { isEmpty } from 'ember-awesome-macros';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import _ from 'lodash';

export default Component.extend(I18n, createDataProxyMixin('handleServices'), {
  handleManager: service(),
  globalNotify: service(),
  currentUser: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceShares.publishModal',

  /**
   * @virtual
   * @type {boolean}
   */
  open: false,

  /**
   * @virtual
   * @type {Models.Share}
   */
  share: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  close: notImplementedThrow,

  handleService: undefined,

  shareMetadata: '',

  /**
   * @override
   */
  fetchHandleServices() {
    return this.get('currentUser').getCurrentUserRecord()
      .then(user => get(user, 'handleServiceList'))
      .then(handleServiceList => handleServiceList.reload())
      .then(handleServiceList => get(handleServiceList, 'list'));
  },

  proceedDisabled: isEmpty('handleService'),

  actions: {
    submit() {
      const {
        share,
        handleManager,
        shareMetadata,
        handleService,
        globalNotify,
      } = this.getProperties(
        'share',
        'handleManager',
        'shareMetadata',
        'handleService',
        'globalNotify'
      );
      const handleServiceId = get(handleService, 'entityId');
      return handleManager.createHandle(share, handleServiceId, shareMetadata)
        .catch(error => {
          globalNotify.backendError(this.t('publishing'), error);
          throw error;
        })
        .then(() => {
          this.get('close')();
        });
    },
    close() {
      this.get('close')();
    },
    nameMatcher(model, term) {
      term = term.toLocaleLowerCase();
      const name = get(model, 'name').toLocaleLowerCase();
      return _.includes(name, term) ? 1 : -1;
    },
  },
});
