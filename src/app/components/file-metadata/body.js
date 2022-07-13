import Component from '@ember/component';
import { reads } from '@ember/object/computed';

export default Component.extend({
  classNames: ['file-metadata-body'],

  /**
   * @type {Utils.FileMetadataViewModel}
   */
  viewModel: undefined,

  file: reads('viewModel.file'),
});
