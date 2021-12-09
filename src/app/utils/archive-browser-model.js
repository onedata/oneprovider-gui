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
import {
  anySelectedContexts,
  actionContext,
} from 'oneprovider-gui/components/file-browser';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import computedT from 'onedata-gui-common/utils/computed-t';
import DownloadInBrowser from 'oneprovider-gui/mixins/download-in-browser';
import { all as allFulfilled } from 'rsvp';
import { conditional, equal, raw, array, and } from 'ember-awesome-macros';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';
import Looper from 'onedata-gui-common/utils/looper';
import _ from 'lodash';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';

const allButtonNames = Object.freeze([
  'btnCreateArchive',
  'btnRefresh',
  'btnCopyId',
  'btnCreateIncrementalArchive',
  'btnDownloadTar',
  'btnBrowseDip',
  'btnPurge',
]);

export default BaseBrowserModel.extend(DownloadInBrowser, {
  modalManager: service(),
  datasetManager: service(),

  // required by DownloadInBrowser mixin
  fileManager: service(),
  isMobile: service(),
  globalNotify: service(),
  i18n: service(),
  globalClipboard: service(),
  parentAppNavigation: service(),

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
   * - `attachmentState: String`
   * @virtual
   * @type {Object}
   */
  spaceDatasetsViewState: Object.freeze({}),

  /**
   * @virtual
   * @type {(dataset: Models.Dataset, options: Object) => any}
   */
  openCreateArchiveModal: notImplementedThrow,

  /**
   * @virtual
   * @type {(datasets: Array<Models.Dataset>) => any}
   */
  openPurgeModal: notImplementedThrow,

  /**
   * @virtual optional
   * @type {Number}
   */
  refreshInterval: 5 * 1000,

  /**
   * Function argument: data for getDataUrl Onezone function
   * @override
   * @type {Function}
   */
  getDatasetsUrl: notImplementedWarn,

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
  statusBarComponentName: 'archive-browser/table-row-status-bar',

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
  buttonNames: computed('attachmentState', function buttonNames() {
    if (this.get('attachmentState') === 'detached') {
      return _.without(allButtonNames, 'btnCreateArchive');
    } else {
      return [...allButtonNames];
    }
  }),

  /**
   * @type {Looper}
   */
  refreshLooper: undefined,

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isAnySelectedPurging: array.isAny('selectedItems', raw('state'), raw('purging')),

  selectedArchiveHasDip: and(
    equal('selectedItems.length', raw(1)),
    'selectedItems.0.config.includeDip'
  ),

  //#region Action buttons

  btnCopyId: computed(function btnCopyId() {
    return this.createFileAction({
      id: 'copyArchiveId',
      icon: 'circle-id',
      action: (archives) => {
        const archive = archives[0];
        this.get('globalClipboard').copy(
          get(archive, 'entityId'),
          this.t('archiveId')
        );
      },
      showIn: [
        actionContext.singleDir,
        actionContext.singleDirPreview,
      ],
    });
  }),

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
          actionContext.mutliDirPreview,
        ],
      });
    }
  ),

  btnBrowseDip: computed(
    'selectedArchiveHasDip',
    function btnBrowseDip() {
      const selectedArchiveHasDip = this.get('selectedArchiveHasDip');
      let disabledTip;
      if (!selectedArchiveHasDip) {
        disabledTip = this.t('selectedArchiveNoDip');
      }
      return this.createFileAction({
        id: 'browseDip',
        icon: 'browser-directory',
        action: (archives) => {
          return this.browseArchiveDip(archives[0]);
        },
        tip: disabledTip,
        disabled: Boolean(disabledTip),
        showIn: [
          actionContext.singleDir,
          actionContext.singleDirPreview,
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
          const dataset = this.get('dataset');
          return this.openCreateArchiveModal(dataset);
        },
        showIn: [
          actionContext.inDir,
          actionContext.currentDir,
          actionContext.spaceRootDir,
        ],
      });
    }
  ),

  btnCreateIncrementalArchive: computed(
    'dataset',
    'attachmentState',
    'spacePrivileges.{manageDatasets,createArchives}',
    function btnCreateArchive() {
      const {
        spacePrivileges,
        attachmentState,
        i18n,
      } = this.getProperties(
        'spacePrivileges',
        'attachmentState',
        'i18n',
      );
      let disabledTip;
      if (attachmentState === 'detached') {
        disabledTip = this.t('notAvailableForDetached');
      } else {
        const hasPrivileges = spacePrivileges.manageDatasets &&
          spacePrivileges.createArchives;
        if (!hasPrivileges) {
          disabledTip = insufficientPrivilegesMessage({
            i18n,
            modelName: 'space',
            privilegeFlag: ['space_manage_datasets', 'space_create_archives'],
          });
        }
      }
      return this.createFileAction({
        id: 'createIncrementalArchive',
        icon: 'browser-archive-add',
        tip: disabledTip,
        disabled: Boolean(disabledTip),
        action: (archives) => {
          const dataset = this.get('dataset');
          return this.openCreateArchiveModal(dataset, {
            baseArchive: archives[0],
          });
        },
        showIn: [
          actionContext.singleDir,
          actionContext.singleDirPreview,
        ],
      });
    }
  ),

  btnPurge: computed(
    'areMultipleSelected',
    'isAnySelectedPurging',
    'spacePrivileges.removeArchives',
    function btnPurge() {
      const {
        areMultipleSelected,
        isAnySelectedPurging,
        spacePrivileges,
        i18n,
      } =
      this.getProperties(
        'areMultipleSelected',
        'isAnySelectedPurging',
        'spacePrivileges',
        'i18n',
      );
      const hasPrivileges = spacePrivileges.removeArchives;
      let disabledTip;
      if (!hasPrivileges) {
        disabledTip = insufficientPrivilegesMessage({
          i18n,
          modelName: 'space',
          privilegeFlag: ['space_remove_archives'],
        });
      } else if (isAnySelectedPurging) {
        disabledTip = this.t('alreadyPurging');
      }
      return this.createFileAction({
        id: 'purge',
        icon: 'browser-delete',
        title: this.t(`fileActions.purge.${areMultipleSelected ? 'multi' : 'single'}`),
        tip: disabledTip,
        disabled: Boolean(disabledTip),
        action: (archives) => {
          return this.openPurgeModal(archives);
        },
        showIn: [
          ...anySelectedContexts,
        ],
      });
    }
  ),

  //#endregion

  init() {
    this._super(...arguments);
    const refreshInterval = this.get('refreshInterval');
    const refreshLooper = Looper.create({
      interval: refreshInterval,
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
    const itemsArray = this.get('fbTableApi').getFilesArray();
    if (itemsArray) {
      itemsArray.forEach(item => {
        item.reload()
          .catch(error => {
            console.warn(
              `util:archive-browser-model#refreshList: reload list item (${item && get(item, 'id')}) failed: ${error}`
            );
          });
      });
    }
  },

  async downloadArchives(archives) {
    const rootDirs = await allFulfilled(archives.mapBy('rootDir'));
    const dirIds = rootDirs.compact().mapBy('entityId').compact();
    return this.downloadFilesById(dirIds);
  },

  browseArchiveDip(archive) {
    const {
      getDatasetsUrl,
      dataset,
      parentAppNavigation,
    } = this.getProperties('getDatasetsUrl', 'dataset', 'parentAppNavigation');
    const dipArchiveId = archive.relationEntityId('relatedDip');
    const datasetId = get(dataset, 'entityId');
    const url = getDatasetsUrl({
      selectedDatasets: [datasetId],
      archive: dipArchiveId,
    });
    return parentAppNavigation.openUrl(url);
  },
});
