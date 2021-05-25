/**
 * Implementation of browser-model (logic and co-related data) for archive-browser
 * (a browser for mananging archives list).
 *
 * @module utils/archive-browser-model
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseBrowserModel from 'oneprovider-gui/utils/base-browser-model';
import { actionContext } from 'oneprovider-gui/components/file-browser';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import computedT from 'onedata-gui-common/utils/computed-t';
import DownloadInBrowser from 'oneprovider-gui/mixins/download-in-browser';
import { all as allFulfilled } from 'rsvp';
import { conditional, equal, raw } from 'ember-awesome-macros';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import Looper from 'onedata-gui-common/utils/looper';
import _ from 'lodash';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';

const allButtonNames = Object.freeze([
  'btnRefresh',
  'btnCreateArchive',
  'btnDownloadTar',
]);

export default BaseBrowserModel.extend(DownloadInBrowser, {
  modalManager: service(),
  datasetManager: service(),

  // required by DownloadInBrowser mixin
  fileManager: service(),
  isMobile: service(),
  globalNotify: service(),

  /**
   * @override
   */
  downloadScope: 'private',

  /**
   * One of: attached, detached.
   * Which state tree of datasets is displayed.
   * @type {ComputedProperty<String>}
   */
  attachmentState: reads('spaceDatasetsViewState.attachmentState').readOnly(),

  dataset: reads('spaceDatasetsViewState.browsableDataset').readOnly(),

  /**
   * State of space-datasets container for datasets-browser.
   * Properties:
   * - `browsableDataset: String`
   * @virtual
   * @type {Object}
   */
  spaceDatasetsViewState: Object.freeze({}),

  /**
   * @virtual
   * @type {(archive: Models.Archive) => any}
   */
  openArchiveDirView: notImplementedThrow,

  /**
   * @override
   * @type {(dataset: Models.Dataset) => any}
   */
  openCreateArchiveModal: notImplementedThrow,

  /**
   * @override
   */
  i18nPrefix: 'utils.archiveBrowserModel',

  /**
   * @override
   */
  rowComponentName: 'archive-browser/table-row',

  /**
   * @override
   */
  mobileInfoComponentName: 'archive-browser/table-row-mobile-info',

  /**
   * @override
   */
  columnsComponentName: 'archive-browser/table-row-columns',

  /**
   * @override
   */
  headRowComponentName: 'archive-browser/table-head-row',

  /**
   * @override
   */
  emptyDirComponentName: 'archive-browser/empty-dir',

  /**
   * @override
   */
  browserClass: 'archive-browser',

  /**
   * @override
   */
  rootIcon: conditional(
    equal('spaceDatasetsViewState.browsableDataset.rootFileType', raw('file')),
    raw('browser-dataset-file'),
    raw('browser-dataset')
  ),

  /**
   * @override
   */
  currentDirTranslation: computedT('archiveList'),

  /**
   * @override
   */
  /**
   * @override
   */
  buttonNames: computed('attachmentState', function buttonNames() {
    if (this.get('attachmentState') === 'detached') {
      return _.without(allButtonNames, 'btnCreateArchive');
    } else {
      return [...allButtonNames];
    }
  }),

  _window: window,

  navigateDataTarget: '_top',

  /**
   * @type {Looper}
   */
  refreshLooper: undefined,

  //#region Action buttons

  btnDownloadTar: computed(
    function btnDownloadTar() {
      return this.createFileAction({
        id: 'downloadTar',
        icon: 'browser-download',
        action: (archives) => {
          return this.downloadArchives(archives);
        },
        showIn: [
          actionContext.singleDir,
          actionContext.singleDirPreview,
          actionContext.multiDir,
          actionContext.multiDirPreview,
        ],
      });
    }
  ),

  btnCreateArchive: computed(
    'dataset',
    'spacePrivileges.{manageDatasets,createArchives}',
    function btnCreateArchive() {
      const {
        spacePrivileges,
        i18n,
      } = this.getProperties(
        'spacePrivileges',
        'i18n',
      );
      const hasPrivileges = spacePrivileges.manageDatasets &&
        spacePrivileges.createArchives;
      let disabledTip;
      if (!hasPrivileges) {
        disabledTip = insufficientPrivilegesMessage({
          i18n,
          modelName: 'space',
          privilegeFlag: ['space_manage_datasets', 'space_create_archives'],
        });
      }
      return this.createFileAction({
        id: 'createArchive',
        icon: 'browser-archive-add',
        tip: disabledTip,
        disabled: Boolean(disabledTip),
        action: () => {
          return this.openCreateArchiveModal(this.get('dataset'));
        },
        showIn: [
          actionContext.currentDir,
          actionContext.spaceRootDir,
        ],
      });
    }
  ),

  //#endregion

  init() {
    this._super(...arguments);
    const refreshLooper = Looper.create({
      interval: 5 * 1000,
      browserModel: this,
      immediate: false,
    });
    refreshLooper.on('tick', this.refreshList.bind(this));
    this.set('refreshLooper', refreshLooper);
  },

  destroy() {
    try {
      const refreshLooper = this.get('refreshLooper');
      if (refreshLooper) {
        refreshLooper.destroy();
      }
    } finally {
      this._super(...arguments);
    }

  },

  refreshList() {
    this.get('fbTableApi').refresh(false);
  },

  /**
   * @override
   * @param {Models.Archive} archive 
   */
  async onOpenFile(archive) {
    if (archive.belongsTo('rootDir').id()) {
      const rootDir = await get(archive, 'rootDir');
      return this.get('openArchiveDirView')(await rootDir);
    }
  },

  async downloadArchives(archives) {
    const rootDirs = await allFulfilled(archives.mapBy('rootDir'));
    const fileIds = rootDirs.compact().mapBy('entityId').compact();
    return this.downloadFilesById(fileIds);
  },
});
