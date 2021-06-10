import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';

export default Component.extend({
  mockBackend: service(),

  open: true,

  space: reads('mockBackend.entityRecords.space.0'),

  constraintSpec: Object.freeze({
    itemType: 'fileOrDirectory',
    maxItems: 3,
  }),

  actions: {
    submit(selectedItems) {
      this.set('sel', selectedItems);
    },
  },
});
