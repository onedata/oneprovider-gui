/**
 * Tab model for showing file-permissions in file-info-modal
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseTabModel from './base-tab-model';
import { computed } from '@ember/object';
import FilePermissionsViewModel from 'oneprovider-gui/utils/file-permissions-view-model';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { conditional, raw } from 'ember-awesome-macros';

/**
 * @typedef {Object} PermissionsViewModelCreateData
 * @property {boolean} readonly
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
   * @type {Array<Models.File>}
   */
  files: undefined,

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {boolean}
   */
  readonly: undefined,

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
   * @override
   */
  isVisible: computed(function isVisible() {
    if (!this._super(...arguments)) {
      return false;
    }
    const isSupportedFileType = this.files.every(file =>
      file.type === 'file' || file.type === 'dir'
    );
    return isSupportedFileType;
  }),

  /**
   * @type {ComputedProperty<Utils.FilePermissionsViewModel>}
   */
  viewModel: computed('files.[]', 'space', 'readonly', function viewModel() {
    return FilePermissionsViewModel.create({
      ownerSource: this,
      files: this.files,
      space: this.space,
      readonly: this.readonly,
    });
  }),

  /**
   * @override
   */
  checkClose() {
    return this.viewModel.checkClose();
  },
});
