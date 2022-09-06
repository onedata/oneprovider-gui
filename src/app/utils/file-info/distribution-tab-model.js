/**
 * Tab model for showing file-distribution in file-info-modal
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseTabModel from './base-tab-model';
import { computed } from '@ember/object';
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
  bodyComponent: 'file-distribution/body',

  /**
   * @override
   */
  isSupportingMultiFiles: true,

  /**
   * @type {ComputedProperty<Utils.FilePermissionsViewModel>}
   */
  viewModel: computed(
    'file',
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
