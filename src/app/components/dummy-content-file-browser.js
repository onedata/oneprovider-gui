/**
 * Standalone component to test file browser without injected properties.
 *
 * @module components/dummy-content-file-browser
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { get, computed } from '@ember/object';
import { promise } from 'ember-awesome-macros';
import FilesystemBrowserModel from 'oneprovider-gui/utils/filesystem-browser-model';

export default Component.extend({
  currentUser: service(),
  onedataGraph: service(),
  fileManager: service(),
  mockBackend: service(),

  classNames: ['dummy-content-file-browser'],

  containerScrollTop: undefined,

  browserModel: undefined,

  previewMode: false,

  /**
   * @type {Array<Models.File>}
   */
  selectedItems: undefined,

  spacePrivileges: Object.freeze({
    view: true,
    viewQos: true,
    viewTransfers: true,
    manageDatasets: true,
  }),

  spaceProxy: promise.object(computed(function spaceProxy() {
    return this.get('currentUser').getCurrentUserRecord()
      .then(user => get(user, 'effSpaceList'))
      .then(effSpaceList => get(effSpaceList, 'list'))
      .then(list => list.objectAt(0));
  })),

  dirProxy: promise.object(computed(function dirProxy() {
    return this.get('spaceProxy').then(space => get(space, 'rootDir'));
  })),

  init() {
    this._super(...arguments);
    if (!this.get('selectedItems')) {
      this.set('selectedItems', []);
    }
    this.set('browserModel', FilesystemBrowserModel.create({
      ownerSource: this,
      openRemove: this.immediatelyRemove.bind(this),
    }));
    // list of tests
    // this.testJumpDownFromStart();
    this.testJumpUpFromFarMiddle();
  },

  testJumpUpFromFarMiddle() {
    const file = this.get('mockBackend.entityRecords.file.100');
    console.log('--- jump to file 100 at start ---');
    this.set('selectedItems', [file]);
    setTimeout(() => {
      const file = this.get('mockBackend.entityRecords.file.20');
      console.log('--- will jump to file 20 (change selection) ---');
      this.set('selectedItems', [file]);
    }, 2000);
  },

  testJumpDownFromStart() {
    this.set('selectedItems', []);
    setTimeout(() => {
      const file = this.get('mockBackend.entityRecords.file.80');
      console.log('--- will jump to file 80 (set selection) ---');
      this.set('selectedItems', [file]);
    }, 2000);
  },

  immediatelyRemove(files, parentDir) {
    const {
      onedataGraph,
      fileManager,
    } = this.getProperties('onedataGraph', 'fileManager');
    const parentEntityId = get(parentDir, 'entityId');
    files.forEach(f => {
      onedataGraph.removeMockChild(
        parentEntityId,
        get(f, 'entityId')
      );
    });
    fileManager.dirChildrenRefresh(parentEntityId);
  },

  actions: {
    containerScrollTop() {
      return this.get('containerScrollTop')(...arguments);
    },
  },
});
