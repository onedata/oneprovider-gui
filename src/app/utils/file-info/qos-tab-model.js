/**
 * Tab model for showing file-qos in file-info-modal
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseTabModel from './base-tab-model';
import { computed, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import FileQosViewModel from 'oneprovider-gui/utils/file-qos-view-model';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { conditional, raw, getBy, eq } from 'ember-awesome-macros';
import FilesQosStatusModel from 'oneprovider-gui/utils/files-qos-status-model';
import { qosStatusIcons } from 'oneprovider-gui/utils/file-qos-view-model';

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
    'viewModel.isFooterHidden',
    raw(''),
    raw('file-qos/footer'),
  ),

  /**
   * @override
   */
  isSupportingMultiFiles: true,

  /**
   * @type {Utils.FilesQosStatusModel}
   */
  filesQosStatusModel: null,

  /**
   * @override
   */
  isVisible: computed(
    'previewMode',
    'files.@each.type',
    'space.privileges.viewQos',
    function isVisible() {
      if (!this._super(...arguments)) {
        return false;
      }
      if (this.previewMode) {
        return false;
      }
      if (!this.space.privileges?.viewQos) {
        return false;
      }
      const isSupportedFileType = this.files.every(file =>
        file.type === 'file' || file.type === 'dir'
      );
      return isSupportedFileType;
    }
  ),

  /**
   * @override
   */
  statusIcon: reads('allQosStatusIcon'),

  /**
   * @override
   */

  qosStatusClassMapping: Object.freeze({
    error: 'tab-status-danger',
    empty: 'tab-status-default',
    fulfilled: 'tab-status-success',
    pending: 'tab-status-warning',
    impossible: 'tab-status-danger',
  }),

  allQosStatus: reads('filesQosStatusModel.allQosStatus'),

  tabClass: computed('qosStatusClassMapping', 'allQosStatus', function tabClass() {
    return `qos-status-${this.allQosStatus} ` +
      (this.qosStatusClassMapping[this.allQosStatus] ?? '');
  }),

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
      return FileQosViewModel.create({
        ownerSource: this,
        previewMode: this.previewMode,
        files: this.files,
        space: this.space,
        filesQosStatusModel: this.filesQosStatusModel,
        onClose: this.fileInfoModal.close.bind(this.fileInfoModal),
      });
    }
  ),

  allQosStatusIcon: conditional(
    eq('filesQosStatusModel.allQosStatus', raw('empty')),
    raw(''),
    getBy(raw(qosStatusIcons), 'filesQosStatusModel.allQosStatus'),
  ),

  autoStatusWatchConfigurator: observer(
    'files.[]',
    'isVisible',
    function autoStatusWatchConfigurator() {
      if (this.files && this.isVisible) {
        this.reinitializeFilesQosStatusModel();
      } else {
        this.filesQosStatusModel?.destroy();
      }
    }
  ),

  init() {
    this._super(...arguments);
    if (this.files && this.isVisible) {
      this.reinitializeFilesQosStatusModel();
    }
  },

  /**
   * @override
   */
  destroy() {
    try {
      this.filesQosStatusModel?.destroy();
    } finally {
      this._super(...arguments);
    }
  },

  /**
   * @override
   */
  checkClose() {
    return this.viewModel.checkClose();
  },

  reinitializeFilesQosStatusModel() {
    this.filesQosStatusModel?.destroy();
    this.set('filesQosStatusModel', FilesQosStatusModel.create({
      ownerSource: this,
      files: this.files,
    }));
  },
});
