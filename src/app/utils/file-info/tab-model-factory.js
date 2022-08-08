import MetadataTabModel from './metadata-tab-model';
import EmberObject from '@ember/object';
import { reads } from '@ember/object/computed';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';

/**
 * @typedef {'metadata'} FileInfoTabType
 */

export default EmberObject.extend(OwnerInjector, {
  /**
   * @virtual
   * @type {Components.FileInfoModal}
   */
  fileInfoModal: undefined,

  /**
   * @param {FileInfoTabType} type
   * @param {Object} options options passed to specific tab model constructor/object
   * @returns {EmberObject}
   */
  createTabModel(type, options) {
    switch (type) {
      case 'metadata':
        return this.createMetadataTabModel(options);
      default:
        throw new Error(`no such file info tab type: "${type}"`);
    }
  },

  createMetadataTabModel(options) {
    return MetadataTabModel.extend({
      file: reads('fileInfoModal.file'),
    }).create({
      viewModelCreateData: options,
      fileInfoModal: this.fileInfoModal,
      ownerSource: this,
    });
  },
});
