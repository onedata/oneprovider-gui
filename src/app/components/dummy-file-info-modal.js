import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { collect } from 'ember-awesome-macros';
import globals from 'onedata-gui-common/utils/globals';

export default Component.extend({
  mockBackend: service(),

  opened: true,

  // uncomment for globally-mocked file
  space: reads('mockBackend.entityRecords.space.0'),
  share: null,
  files: collect('mockBackend.entityRecords.file.5'),

  // uncomment for multi files
  // files: collect(
  //   // a directory with QoS
  //   'mockBackend.entityRecords.chainDir.2',
  //   'mockBackend.entityRecords.chainDir.3',
  //   'mockBackend.entityRecords.chainDir.4',
  // ),

  previewMode: false,

  actions: {
    closeInfoModal() {
      this.set('files', null);
    },
    getDataUrl() {
      return globals.location.toString();
    },
  },
});
