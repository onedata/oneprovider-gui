import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';

export default Component.extend({
  mockBackend: service(),

  // file: reads('mockBackend.entityRecords.file.firstObject'),

  file: reads('mockBackend.entityRecords.chainDir.2'),

  open: true,

  actions: {
    getShareUrl() {
      return 'https://example.com';
    },
  },
});
