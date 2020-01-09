import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';

export default Component.extend({
  mockBackend: service(),

  dirId: undefined,

  spaceId: reads('mockBackend.entityRecords.space.firstObject.entityId'),

  // Uncomment to enter share immediately without list
  shareId: reads('mockBackend.entityRecords.share.firstObject.entityId'),

  actions: {
    getShareUrl( /* { shareId } */ ) {
      return location.toString();
    },
    updateDirId(dirId) {
      this.set('dirId', dirId);
    },
  },
});
