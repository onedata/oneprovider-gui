import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';

// TODO: VFS-10430 fix or remove this dummy component

export default Component.extend({
  mockBackend: service(),

  file: reads('mockBackend.entityRecords.chainDir.2'),

  open: true,

  actions: {
    getShareUrl() {
      return 'https://example.com';
    },
  },
});
