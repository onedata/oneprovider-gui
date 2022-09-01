/**
 * Tab model for showing file-qos in file-info-modal
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseTabModel from './base-tab-model';
import { get, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import FileQosViewModel from 'oneprovider-gui/utils/file-qos-view-model';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { conditional, raw, eq } from 'ember-awesome-macros';

const mixins = [
  OwnerInjector,
  I18n,
];

export default BaseTabModel.extend(...mixins, {
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.fileInfo.qosTabModel',

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
  tabId: 'qos',

  /**
   * @override
   */
  headerComponent: 'file-qos/header',

  /**
   * @override
   */
  bodyComponent: 'file-qos/body',

  /**
   * @override
   */
  footerComponent: conditional(
    'viewModel.hideFooter',
    raw(''),
    raw('file-qos/footer'),
  ),

  /**
   * @override
   */
  isSupportingMultiFiles: true,

  /**
   * @override
   */
  isVisible: computed(function isVisible() {
    if (!this._super(...arguments)) {
      return false;
    }
    if (this.previewMode) {
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
  viewModel: computed('file', 'space', 'previewMode', function viewModel() {
    return FileQosViewModel.create({
      ownerSource: this,
      previewMode: this.previewMode,
      files: this.files,
      space: this.space,
    });
  }),

  /**
   * @override
   */
  checkClose() {
    return this.viewModel.checkClose();
  },
});
