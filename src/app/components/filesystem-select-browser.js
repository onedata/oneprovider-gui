import Component from '@ember/component';
import { reads } from '@ember/object/computed';

export default Component.extend({
  browserModel: undefined,
  selectorModel: undefined,

  createItemParentDir: reads('selectorModel.createItemParentDir'),
  createItemType: reads('selectorModel.createItemType'),

  closeCreateItemModal(...args) {
    return this.get('selectorModel').closeCreateItemModal(...args);
  },
});
