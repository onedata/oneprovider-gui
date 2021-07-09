import Component from '@ember/component';
import { reads } from '@ember/object/computed';

export default Component.extend({
  browserModel: undefined,
  selectorModel: undefined,

  createItemParentDir: reads('selectorModel.createItemParentDir'),
  createItemType: reads('selectorModel.createItemType'),
  fileToRename: reads('selectorModel.fileToRename'),
  renameParentDir: reads('selectorModel.renameParentDir'),

  closeCreateItemModal(...args) {
    return this.get('selectorModel').closeCreateItemModal(...args);
  },

  closeRenameModal(...args) {
    return this.get('selectorModel').closeRenameModal(...args);
  },
});
