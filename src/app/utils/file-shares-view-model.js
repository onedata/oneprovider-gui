/**
 * Model and logic for file-shares components
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { bool } from 'ember-awesome-macros';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';

const mixins = [
  OwnerInjector,
  I18n,
];

export default EmberObject.extend(...mixins, {
  i18n: service(),
  shareManager: service(),
  globalNotify: service(),
  appProxy: service(),
  modalManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.fileSharesViewModel',

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  sharesProxy: reads('file.shareRecords'),

  shares: reads('sharesProxy.content'),

  hasManageSharesPrivileges: reads('space.privileges.manageShares'),

  isCreateShareDisabled: bool('createShareDisabledTip'),

  createShareDisabledTip: computed(
    'hasManageSharesPrivileges',
    function createShareDisabledTip() {
      if (!this.hasManageSharesPrivileges) {
        return insufficientPrivilegesMessage({
          i18n: this.i18n,
          modelName: 'space',
          privilegeFlag: 'space_manage_shares',
        });
      }
      return null;
    }
  ),

  getShareUrl({ shareId }) {
    return this.appProxy.callParent('getShareUrl', { shareId });
  },

  openShareCreator() {
    this.modalManager.show('share-modal', {
      file: this.file,
    });
  },
});
