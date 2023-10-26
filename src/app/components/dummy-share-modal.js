import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';

export default Component.extend({
  mockBackend: service(),
  modalManager: service(),

  file: reads('mockBackend.entityRecords.chainDir.2'),

  /** @override */
  didInsertElement() {
    this.modalManager.show('share-modal', {
      file: this.file,
    });
  },
});
