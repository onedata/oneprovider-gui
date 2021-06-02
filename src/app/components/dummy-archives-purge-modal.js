import Component from '@ember/component';
import { collect } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import browsableArchive from 'oneprovider-gui/utils/browsable-archive';

export default Component.extend({
  mockBackend: service(),

  open: true,

  archives: collect(
    'mockBackend.entityRecords.archive.0',
    // 'mockBackend.entityRecords.archive.1',
    // 'mockBackend.entityRecords.archive.2',
  ),

  browsableArchives: computed('archives.[]', function browsableArchives() {
    return this.get('archives').map(a => browsableArchive.create({ content: a }));
  }),
});
