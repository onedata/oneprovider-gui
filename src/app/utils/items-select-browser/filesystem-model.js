import BaseModel from './base-model';
import { computed, get } from '@ember/object';
import SelectorFilesystemBrowserModel from 'oneprovider-gui/utils/selector-filesystem-browser-model';
import { promise } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';

export default BaseModel.extend({
  fileManager: service(),

  /**
   * @override
   */
  browserModel: computed(function browserModel() {
    return SelectorFilesystemBrowserModel.create({
      ownerSource: this,
      onSubmitSingleItem: this.get('onSubmitSingleItem'),
    });
  }),

  /**
   * @override
   */
  dirProxy: promise.object(computed('space.rootDir', 'dirId', function dirProxy() {
    const {
      space,
      dirId,
    } = this.getProperties('space', 'dirId');
    if (dirId) {
      return this.get('fileManager').getFileById(dirId);
    } else {
      return get(space, 'rootDir');
    }
  })),

  /**
   * @override
   */
  async fetchChildren(dirId, startIndex, size, offset) {
    const fileManager = this.get('fileManager');
    return fileManager
      .fetchDirChildren(dirId, 'private', startIndex, size, offset);
  },
});
