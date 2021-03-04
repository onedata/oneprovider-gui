import Component from '@ember/component';
import { collect } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';

export default Component.extend({
  opened: true,

  mockBackend: service(),

  files: collect(
    'mockBackend.entityRecords.chainDir.4',
  ),
});
