/**
 * Shows modal allowing to change share name.
 *
 * @module components/space-shares/rename-modal
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get } from '@ember/object';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { tag } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  shareManager: service(),
  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceShares.renameModal',

  /**
   * @virtual
   * @type {boolean}
   */
  opened: false,

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

  editValue: '',

  inputId: tag `${'elementId'}-input`,

  actions: {
    submit() {
      const {
        share,
        shareManager,
        editValue,
        globalNotify,
      } = this.getProperties('share', 'shareManager', 'editValue', 'globalNotify');
      return shareManager.renameShare(share, editValue)
        .catch(error => {
          this.set('editValue', get(share, 'name'));
          globalNotify.backendError(this.t('renaming'), error);
          throw error;
        })
        .then(() => {
          this.get('close')();
        });
    },
    close() {
      this.get('close')();
    },
  },
});
