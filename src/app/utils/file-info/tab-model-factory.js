/**
 * A central point for creating all known file-info-modals tab models.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import MetadataTabModel from './metadata-tab-model';
import PermissionsTabModel from './permissions-tab-model';
import SharesTabModel from './shares-tab-model';
import QosTabModel from './qos-tab-model';
import DistributionTabModel from './distribution-tab-model';
import EmberObject from '@ember/object';
import { reads } from '@ember/object/computed';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';

export default EmberObject.extend(OwnerInjector, {
  /**
   * @virtual
   * @type {Components.FileInfoModal}
   */
  fileInfoModal: undefined,

  /**
   * @param {FileInfoTabId} type
   * @param {Object} options options passed to specific tab model constructor/object
   * @returns {EmberObject}
   */
  createTabModel(type, options) {
    switch (type) {
      case 'metadata':
        return this.createMetadataTabModel(options);
      case 'permissions':
        return this.createPermissionsTabModel(options);
      case 'shares':
        return this.createSharesTabModel(options);
      case 'qos':
        return this.createQosTabModel();
      case 'distribution':
        return this.createDistributionTabModel();
      default:
        throw new Error(`no such file info tab type or has no model: "${type}"`);
    }
  },

  createMetadataTabModel(options) {
    return MetadataTabModel.extend({
      file: reads('fileInfoModal.file'),
      space: reads('fileInfoModal.space'),
    }).create({
      fileInfoModal: this.fileInfoModal,
      ownerSource: this,
      ...options,
    });
  },

  createPermissionsTabModel(options) {
    return PermissionsTabModel.extend({
      files: reads('fileInfoModal.files'),
      space: reads('fileInfoModal.space'),
    }).create({
      fileInfoModal: this.fileInfoModal,
      ownerSource: this,
      ...options,
    });
  },

  createSharesTabModel(options) {
    return SharesTabModel.extend({
      file: reads('fileInfoModal.file'),
      space: reads('fileInfoModal.space'),
    }).create({
      fileInfoModal: this.fileInfoModal,
      ownerSource: this,
      ...options,
    });
  },

  /**
   * @returns {Utils.QosTabModel}
   */
  createQosTabModel() {
    return QosTabModel.extend({
      files: reads('fileInfoModal.files'),
      space: reads('fileInfoModal.space'),
      previewMode: reads('fileInfoModal.previewMode'),
    }).create({
      fileInfoModal: this.fileInfoModal,
      ownerSource: this,
      ...this.fileInfoModal.tabOptions?.qos,
    });
  },

  /**
   * @returns
   */
  createDistributionTabModel() {
    return DistributionTabModel.extend({
      files: reads('fileInfoModal.files'),
      space: reads('fileInfoModal.space'),
      previewMode: reads('fileInfoModal.previewMode'),
    }).create({
      fileInfoModal: this.fileInfoModal,
      ownerSource: this,
      ...this.fileInfoModal.tabOptions?.distribution,
    });
  },
});
