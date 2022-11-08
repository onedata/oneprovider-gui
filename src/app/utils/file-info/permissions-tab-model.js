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
import { conditional, raw, array } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';

export default BaseTabModel.extend({
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
   * @override
   */
  modalClass: 'with-sticky-footer',

  statusTag: conditional(
    'isAnyFileWithAcl',
    computedT('acl'),
    raw(null),
  ),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isAnyFileWithAcl: array.isAny('files', raw('activePermissionsType'), raw('acl')),

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
