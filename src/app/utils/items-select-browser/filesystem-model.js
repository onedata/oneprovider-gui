import BaseModel from './base-model';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import SelectorFilesystemBrowserModel from 'oneprovider-gui/utils/selector-filesystem-browser-model';
import { promise, isEmpty, or } from 'ember-awesome-macros';
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

  allowedFileTypes: reads('constraintSpec.allowedFileTypes'),

  allTypesAreAllowed: or(
    isEmpty('allowedFileTypes'),
    computed('allowedFileTypes', function allTypesAllowes() {
      return ['file', 'dir', 'symlink'].every(type =>
        this.get('allowedFileTypes').includes(type)
      );
    }),
  ),

  /**
   * @override
   */
  getValidationError() {
    const baseValidation = this._super(...arguments);
    if (baseValidation) {
      return baseValidation;
    }
    const {
      allowedFileTypes,
      allTypesAreAllowed,
      selectedItems,
    } = this.getProperties('allowedFileTypes', 'allTypesAreAllowed', 'selectedItems');
    if (allTypesAreAllowed) {
      return;
    }
    const selectedItemsTypes = selectedItems.mapBy('type');
    for (const type of selectedItemsTypes) {
      if (!allowedFileTypes.includes(type)) {
        // FIXME: i18n
        return `Only ${allowedFileTypes.join(' and ')} are allowed to be selected.`;
      }
    }
  },
});
