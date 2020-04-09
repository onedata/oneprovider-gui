import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';

export default Component.extend({
  mockBackend: service(),
  navigationState: service(),

  file: reads('mockBackend.entityRecords.file.firstObject'),

  open: true,

  previewMode: reads('navigationState.aspectOptions.previewMode'),
});
