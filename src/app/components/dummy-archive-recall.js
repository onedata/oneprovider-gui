import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { computed } from '@ember/object';
import { promise } from 'ember-awesome-macros';

export default Component.extend({
  mockBackend: service(),
  archiveManager: service(),

  space: reads('mockBackend.entityRecords.space.0'),

  archiveProxy: promise.object(computed(
    'mockBackend.entityRecords.archive.0',
    function archiveProxy() {
      const rawArchive = this.get('mockBackend.entityRecords.archive.0');
      return this.get('archiveManager').getBrowsableArchive(rawArchive);
    }
  )),

  archive: reads('archiveProxy.content'),
});
