import MetadataTabModel from './metadata-tab-model';
import FileMetadataViewModel from 'oneprovider-gui/utils/file-metadata-view-model';
import EmberObject from '@ember/object';
import { reads } from '@ember/object/computed';

/**
 * @typedef {'metadata'} FileInfoTabType
 */

export default EmberObject.extend({
  /**
   * @virtual
   * @type {Components.FileInfoModal}
   */
  fileInfoModal: undefined,

  /**
   * @param {FileInfoTabType} type
   * @returns {EmberObject}
   */
  createTabModel(type) {
    switch (type) {
      case 'metadata':
        return this.createMetadataTabModel();
      default:
        throw new Error(`no such file info tab type: "${type}"`);
    }
  },

  createMetadataTabModel() {
    const fileMetadataViewModel = FileMetadataViewModel.extend({
      file: reads('fileInfoModal.file'),
    }).create({
      fileInfoModal: this.fileInfoModal,
    });
    return MetadataTabModel.extend({
      viewModel: fileMetadataViewModel,
    }).create({
      ownerSource: this,
    });
  },
});
