/**
 * Standalone component to test file browser without injected properties.
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { get, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { promise } from 'ember-awesome-macros';
import FilesystemBrowserModel from 'oneprovider-gui/utils/filesystem-browser-model';
import sleep from 'onedata-gui-common/utils/sleep';
import globals from 'onedata-gui-common/utils/globals';

export default Component.extend({
  currentUser: service(),
  onedataGraph: service(),
  fileManager: service(),
  mockBackend: service(),

  classNames: ['dummy-content-file-browser'],

  containerScrollTop: undefined,

  browserModel: undefined,

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

  dirProxy: promise.object(computed(async function dirProxy() {
    // uncomment for space 0 root dir - rich features presentation
    return this.get('mockBackend.entityRecords.space.0.rootDir');
    // uncomment for simulating nested directory
    // return this.get('mockBackend.entityRecords.chainDir.2');
    // uncomment for empty dir
    // return this.get('mockBackend.entityRecords.dir.2');
  })),

  init() {
    this._super(...arguments);
    if (!this.get('selectedItems')) {
      this.set('selectedItems', []);
    }
    this.set('browserModel', FilesystemBrowserModel
      .extend({
        dirProxy: reads('ownerSource.dirProxy'),
        selectedItemsForJump: reads('ownerSource.selectedItemsForJump'),
        space: reads('ownerSource.spaceProxy.content'),
      })
      .create({
        ownerSource: this,
        previewMode: false,
        openRemove: this.immediatelyRemove.bind(this),
      }));
    // list of tests
    // this.testJumpToVisible(null, 3, 6);
    // this.testBlinkInterval();
    // this.testJumpToVisible(2000);
    // this.testJumpDownFromStart(null);
    // this.testJumpDownFromStart(2000);
    // this.testJumpUpFromFarMiddle(6000);
    // setTimeout(() => {
    //   console.clear();
    //   this.scrollTopInfinite();
    // }, 3000);
  },

  /**
   * @override
   */
  willDestroyElement() {
    try {
      this.browserModel?.destroy?.();
    } finally {
      this._super(...arguments);
    }
  },

  scrollTopInfinite() {
    globals.document.getElementById('content-scroll').scrollTop =
      globals.document.getElementById('content-scroll').scrollTop - 20;
    setTimeout(() => {
      this.scrollTopInfinite();
    }, 10);
  },

  async testJumpToVisible(delay = null, start = 3, end = 6) {
    if (delay !== null) {
      await sleep(delay);
    }
    const files = this.get('mockBackend.entityRecords.file').slice(start, end);
    console.log('--- select visible files ---');
    this.set('selectedItemsForJump', files);
  },

  async testBlinkInterval(range = 2, max = 10, interval = 4000) {
    let i = 0;
    const intervalHandler = setInterval(() => {
      this.testJumpToVisible(null, i % max, (i + range) % max);
      i += range;
    }, interval);
    return intervalHandler;
  },

  async testJumpDownFromStart(delay = null) {
    if (delay !== null) {
      await sleep(delay);
    }
    const file = this.get('mockBackend.entityRecords.file.199');
    console.log('--- will jump to file 199 ---');
    this.set('selectedItemsForJump', [file]);
  },

  async testJumpUpFromFarMiddle(delay = 2000) {
    const file = this.get('mockBackend.entityRecords.file.100');
    console.log(`--- jump to "${get(file, 'name')}" at start ---`);
    this.set('selectedItemsForJump', [file]);
    await sleep(delay);
    const otherFile = this.get('mockBackend.entityRecords.file.20');
    console.log(`--- will jump to "${get(otherFile, 'name')}"---`);
    this.set('selectedItemsForJump', [otherFile]);
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
