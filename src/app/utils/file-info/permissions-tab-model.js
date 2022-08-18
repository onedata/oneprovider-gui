/**
 * Tab model for showing file-permissions in file-info-modal
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseTabModel from './base-tab-model';
import { conditional, raw } from 'ember-awesome-macros';
import { computed } from '@ember/object';
import FilePermissionsViewModel from 'oneprovider-gui/utils/file-permissions-view-model';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

/**
 * @typedef {Object} PermissionsViewModelCreateData
 * @property {boolean} previewMode
 */

const mixins = [
  OwnerInjector,
  I18n,
];

export default BaseTabModel.extend(...mixins, {
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.fileInfo.permissionsTabModel',

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * Data needed to lazily instantiate ViewModel.
   * @virtual
   * @type {PermissionsViewModelCreateData}
   */
  viewModelCreateData: undefined,

  /**
   * @override
   */
  tabId: 'permissions',

  /**
   * @override
   */
  isSupportingMultiFiles: true,

  /**
   * @override
   */
  headerComponent: 'file-permissions/header',

  /**
   * @override
   */
  bodyComponent: 'file-permissions/body',

  /**
   * @override
   */
  footerComponent: conditional(
    'viewModel.effectiveReadonly',
    raw(''),
    raw('file-permissions/footer'),
  ),

  /**
   * @type {ComputedProperty<Utils.FilePermissionsViewModel>}
   */
  viewModel: computed('file', 'space', function viewModel() {
    return FilePermissionsViewModel.create({
      ownerSource: this,
      file: this.file,
      space: this.space,
      ...this.viewModelCreateData,
    });
  }),
});
