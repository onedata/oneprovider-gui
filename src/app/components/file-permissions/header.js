/**
 * Header with permissions type switch
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  classNames: ['file-permissions-header'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.filePermissions.header',

  /**
   * @virtual
   * @type {Utils.FilePermissionsViewModel}
   */
  viewModel: undefined,

  /**
   * @type {Array<FilePermissionsType>}
   */
  permissionsTypes: Object.freeze(['posix', 'acl']),

  /**
   * @type {ComputedProperty<FilePermissionsType>}
   */
  activeTab: reads('viewModel.selectedPermissionsType'),

  activePermissionsType: reads('viewModel.activePermissionsType'),

  effectiveReadonly: reads('viewModel.effectiveReadonly'),

  effectiveReadonlyTip: reads('viewModel.effectiveReadonlyTip'),

  isPermissionsTypeSelectorDisabled: reads('viewModel.isPermissionsTypeSelectorDisabled'),

  actions: {
    /**
     * @param {FilePermissionsType} tabId
     */
    changeTab(tabId) {
      this.viewModel.changeTab(tabId);
    },
  },
});
