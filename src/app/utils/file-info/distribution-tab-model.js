/**
 * Tab model for showing file-distribution in file-info-modal
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseTabModel from './base-tab-model';
import { computed, get } from '@ember/object';
import FileDistributionViewModel from 'oneprovider-gui/utils/file-distribution-view-model';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

const mixins = [
  OwnerInjector,
  I18n,
];

export default BaseTabModel.extend(...mixins, {
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.fileInfo.distributionTabModel',

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
   * @virtual
   * @type {boolean}
   */
  previewMode: false,

  /**
   * @override
   */
  tabId: 'distribution',

  /**
   * @override
   */
  headerComponent: 'file-distribution/header',

  /**
   * @override
   */
  bodyComponent: 'file-distribution/body',

  /**
   * @override
   */
  isSupportingMultiFiles: true,

  /**
   * @override
   */
  isVisible: computed(
    'previewMode',
    'files.@each.type',
    function isVisible() {
      if (
        !this._super(...arguments) ||
        this.previewMode
      ) {
        return false;
      }
      const isSupportedFileType = this.files.every(file =>
        get(file, 'type') === 'file' || get(file, 'type') === 'dir'
      );
      return isSupportedFileType;
    }
  ),

  /**
   * @type {ComputedProperty<Utils.FilePermissionsViewModel>}
   */
  viewModel: computed(
    'files',
    'space',
    'previewMode',
    'filesQosStatusModel',
    'fileInfoModal',
    function viewModel() {
      return FileDistributionViewModel.create({
        ownerSource: this,
        previewMode: this.previewMode,
        files: this.files,
        space: this.space,
      });
    }
  ),
});
