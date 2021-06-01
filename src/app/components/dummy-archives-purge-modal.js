import Component from '@ember/component';
import { collect } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';

export default Component.extend({
  mockBackend: service(),

  open: true,

  archives: collect(
    'mockBackend.entityRecords.archive.0',
    'mockBackend.entityRecords.archive.1',
    'mockBackend.entityRecords.archive.2',
  ),
});
