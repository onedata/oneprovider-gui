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
import { all as allFulfilled, allSettled } from 'rsvp';
import { conditional, equal, raw, array, and, or } from 'ember-awesome-macros';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';
import Looper from 'onedata-gui-common/utils/looper';
import _ from 'lodash';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';

const allButtonNames = Object.freeze([
  'btnArchiveProperties',
  'btnEditDescription',
  'btnCreateArchive',
  'btnRefresh',
  'btnCopyId',
  'btnCreateIncrementalArchive',
  'btnRecall',
  'btnDownloadTar',
  'btnBrowseDip',
  'btnDelete',
  'btnCancel',
]);

export default BaseBrowserModel.extend(DownloadInBrowser, {
  modalManager: service(),
  datasetManager: service(),
  archiveManager: service(),

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
   * @override
   */
  infoIconActionName: 'archiveProperties',

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
   * @type {(archives: Array<Utils.BrowsableArchive>) => any}
   */
  openDeleteModal: notImplementedThrow,

  /**
   * @virtual
   * @type {(archive: Utils.BrowsableArchive, options: Object) => any}
   */
  openRecallModal: notImplementedThrow,

  /**
   * @virtual
   * @type {(archives: Array<Utils.BrowsableArchive>, options: Object) => any}
   */
  openArchivePropertiesModal: notImplementedThrow,

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
  mobileSecondaryInfoComponentName: 'archive-browser/table-row-mobile-secondary-info',

  /**
   * @override
   */
  secondaryInfoComponentName: 'archive-browser/table-row-secondary-info',

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
  dirLoadErrorComponentName: 'archive-browser/dir-load-error',

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
  buttonNames: computed(
    'attachmentState',
    'isAnySelectedCreating',
    function buttonNames() {
      const {
        attachmentState,
        isAnySelectedCreating,
      } = this.getProperties(
        'attachmentState',
        'isAnySelectedCreating',
      );
      let visibleButtons = [...allButtonNames];
      if (attachmentState === 'detached') {
        visibleButtons = _.without(visibleButtons, 'btnCreateArchive');
      }
      if (!isAnySelectedCreating) {
        visibleButtons = _.without(visibleButtons, 'btnCancel');
      }
      return visibleButtons;
    }
  ),

  /**
   * @type {Looper}
   */
  refreshLooper: undefined,

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isAnySelectedDeleting: array.isAny('selectedItems', raw('state'), raw('deleting')),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isAnySelectedCreating: array.isAny(
    'selectedItems',
    raw('metaState'),
    raw('creating')
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isAnySelectedEndedIncomplete: or(
    array.isAny(
      'selectedItems',
      raw('metaState'),
      raw('failed')
    ),
    array.isAny(
      'selectedItems',
      raw('metaState'),
      raw('cancelled')
    ),
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isAnySelectedCancelling: array.isAny(
    'selectedItems',
    raw('state'),
    raw('cancelling')
  ),

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
    'isAnySelectedCreating',
    function btnDownloadTar() {
      const disabledTip = this.get('isAnySelectedCreating') ?
        this.t('notAvailableForCreating') : null;
      return this.createFileAction({
        id: 'downloadTar',
        icon: 'browser-download',
        tip: disabledTip,
        disabled: Boolean(disabledTip),
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

  btnArchiveProperties: computed(
    function btnArchiveProperties() {
      return this.createFileAction({
        id: 'archiveProperties',
        icon: 'properties',
        action: (archives) => {
          return this.openArchivePropertiesModal(archives[0]);
        },
        showIn: [
          actionContext.singleDir,
          actionContext.singleDirPreview,
        ],
      });
    }
  ),

  btnEditDescription: computed(
    function btnEditDescription() {
      return this.createFileAction({
        id: 'editDescription',
        icon: 'rename',
        action: (archives) => {
          return this.openArchivePropertiesModal(archives[0], { focusDescription: true });
        },
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
    'isAnySelectedCreating',
    'isAnySelected',
    'isAnySelectedEndedIncomplete',
    function btnCreateArchive() {
      const {
        spacePrivileges,
        attachmentState,
        isAnySelectedCreating,
        isAnySelectedEndedIncomplete,
        i18n,
      } = this.getProperties(
        'spacePrivileges',
        'attachmentState',
        'isAnySelectedCreating',
        'isAnySelectedEndedIncomplete',
        'i18n',
      );
      let disabledTip;
      if (isAnySelectedCreating) {
        disabledTip = this.t('notAvailableForCreating');
      } else if (isAnySelectedEndedIncomplete) {
        disabledTip = this.t('notAvailableForIncomplete');
      } else if (attachmentState === 'detached') {
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

  btnRecall: computed(
    'spacePrivileges.recallArchives',
    'isAnySelectedCreating',
    'isAnySelectedEndedIncomplete',
    function btnDelete() {
      const {
        isAnySelectedCreating,
        isAnySelectedEndedIncomplete,
        spacePrivileges,
        i18n,
      } =
      this.getProperties(
        'isAnySelectedCreating',
        'isAnySelectedEndedIncomplete',
        'spacePrivileges',
        'i18n',
      );
      const hasPrivileges = spacePrivileges.recallArchives && spacePrivileges.writeData;
      let disabledTip;
      if (isAnySelectedCreating) {
        disabledTip = this.t('notAvailableForCreating');
      } else if (isAnySelectedEndedIncomplete) {
        disabledTip = this.t('notAvailableForIncomplete');
      } else if (!hasPrivileges) {
        disabledTip = insufficientPrivilegesMessage({
          i18n,
          modelName: 'space',
          privilegeFlag: ['space_recall_archives', 'space_write_data'],
        });
      }
      return this.createFileAction({
        id: 'recall',
        icon: 'browser-archive-recall',
        tip: disabledTip,
        disabled: Boolean(disabledTip),
        action: (archives) => {
          return this.openRecallModal(archives[0]);
        },
        showIn: [
          actionContext.singleDir,
          actionContext.singleDirPreview,
        ],
      });
    }
  ),

  btnDelete: computed(
    'areMultipleSelected',
    'isAnySelectedDeleting',
    'spacePrivileges.removeArchives',
    'isAnySelectedCreating',
    function btnDelete() {
      const {
        isAnySelectedCreating,
        areMultipleSelected,
        isAnySelectedDeleting,
        spacePrivileges,
        i18n,
      } =
      this.getProperties(
        'isAnySelectedCreating',
        'areMultipleSelected',
        'isAnySelectedDeleting',
        'spacePrivileges',
        'i18n',
      );
      const hasPrivileges = spacePrivileges.removeArchives;
      let disabledTip;
      if (isAnySelectedCreating) {
        disabledTip = this.t('notAvailableForCreating');
      } else if (!hasPrivileges) {
        disabledTip = insufficientPrivilegesMessage({
          i18n,
          modelName: 'space',
          privilegeFlag: ['space_remove_archives'],
        });
      } else if (isAnySelectedDeleting) {
        disabledTip = this.t('alreadyDeleting');
      }
      return this.createFileAction({
        id: 'delete',
        icon: 'browser-delete',
        title: this.t(`fileActions.delete.${areMultipleSelected ? 'multi' : 'single'}`),
        tip: disabledTip,
        disabled: Boolean(disabledTip),
        action: (archives) => {
          return this.openDeleteModal(archives);
        },
        showIn: [
          ...anySelectedContexts,
        ],
      });
    }
  ),

  btnCancel: computed(
    'isAnySelectedCancelling',
    function btnCancel() {
      const {
        i18n,
        spacePrivileges,
        isAnySelectedCancelling,
      } = this.getProperties(
        'i18n',
        'spacePrivileges',
        'isAnySelectedCancelling',
      );
      let disabledTip;
      const hasPrivileges = spacePrivileges.createArchives;
      if (isAnySelectedCancelling) {
        disabledTip = this.t('alreadyCancelling');
      } else if (!hasPrivileges) {
        disabledTip = insufficientPrivilegesMessage({
          i18n,
          modelName: 'space',
          privilegeFlag: ['space_create_archives'],
        });
      }
      return this.createFileAction({
        id: 'cancel',
        icon: 'cancelled',
        title: this.t('fileActions.cancel'),
        tip: disabledTip,
        disabled: Boolean(disabledTip),
        action: (archives) => {
          return this.openCancelModal(archives);
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

  /**
   * @override
   */
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

  /**
   * @override
   */
  isItemDisabled(item) {
    return item && get(item, 'metaState') === 'destroying';
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

  /**
   * @type {(archives: Array<Utils.BrowsableArchive>) => any}
   */
  openCancelModal(archives) {
    const isMultiple = archives.length > 1;
    return this.modalManager.show('question-modal', {
      headerIcon: 'sign-warning-rounded',
      headerText: this.t('cancelModal.header'),
      descriptionParagraphs: [{
        text: this.t(
          `cancelModal.message.${isMultiple ? 'multi' : 'single'}`, {
            archivesCount: archives.length,
          }
        ),
      }],
      yesButtonText: this.t('cancelModal.yes'),
      yesButtonType: 'warning',
      noButtonText: this.t('cancelModal.no'),
      onSubmit: async () => {
        const submitResult = await this.cancelMultipleArchivization(archives);
        const firstRejected = submitResult.findBy('state', 'rejected');
        if (firstRejected) {
          const error = get(firstRejected, 'reason');
          this.globalNotify.backendError(
            this.t('cancelModal.cancelling'),
            error
          );
          throw error;
        }
        return submitResult;
      },
    }).hiddenPromise;
  },

  async cancelMultipleArchivization(archives) {
    const archiveManager = this.archiveManager;
    return await allSettled(archives.map(archive =>
      archiveManager.cancelArchivization(archive)
    ));
  },
});
