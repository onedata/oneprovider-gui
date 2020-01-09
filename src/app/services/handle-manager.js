import Service, { inject as service } from '@ember/service';
import { get } from '@ember/object';

export default Service.extend({
  store: service(),
  currentUser: service(),

  getHandleServices() {
    return this.get('currentUser').getCurrentUserRecord()
      .then(user => get(user, 'handleServiceList'))
      .then(handleServiceList => get(handleServiceList, 'list'));
  },

  createHandle(share, handleServiceId, metadataString) {
    return this.get('store').createRecord('handle', {
        metadataString,
        _meta: {
          additionalData: {
            shareId: get(share, 'entityId'),
            handleServiceId,
          },
        },
      })
      .save()
      .then(() => share.reload());
  },
});
