import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { collect } from 'ember-awesome-macros';
import globals from 'onedata-gui-common/utils/globals';
import FilesystemBrowserModel from 'oneprovider-gui/utils/filesystem-browser-model';

export default Component.extend({
  mockBackend: service(),

  opened: true,

  /**
   * @type {Utils.FilesystemBrowserModel}
   */
  browserModel: undefined,

  // uncomment for globally-mocked file
  space: reads('mockBackend.entityRecords.space.0'),
  share: null,
  // files: collect('mockBackend.entityRecords.file.5'),

  // uncomment for multi files
  files: collect(
    // 'mockBackend.entityRecords.file.0'
    // a directory with QoS
    'mockBackend.entityRecords.chainDir.2',
    //   'mockBackend.entityRecords.chainDir.3',
    //   'mockBackend.entityRecords.chainDir.4',
  ),

  previewMode: false,

  initialTab: 'general',

  init() {
    this._super(...arguments);
    this.set('browserModel', FilesystemBrowserModel.create({
      ownerSource: this,
    }));
  },

  actions: {
    closeInfoModal() {
      this.set('files', null);
    },
    getDataUrl() {
      return globals.location.toString();
    },
  },
});
