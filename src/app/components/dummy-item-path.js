import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';

export default Component.extend({
  mockBackend: service(),

  item: reads('mockBackend.entityRecords.chainDir.3'),
});
