import Component from '@ember/component';
import { collect } from 'ember-awesome-macros';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';

export default Component.extend({
  mockBackend: service(),

  files: collect(
    'mockBackend.entityRecords.file.10',
    'mockBackend.entityRecords.file.11',
    'mockBackend.entityRecords.file.12',
  ),

  parentDir: reads('mockBackend.entityRecords.spaceRootDir.0'),
});
