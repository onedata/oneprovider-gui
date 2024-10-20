/**
 * Implementation of browser-model (logic and co-related data) for archive-browser
 * (a browser for mananging archives list).
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseBrowserModel from 'oneprovider-gui/utils/base-browser-model';
import {
  anySelectedContexts,
  actionContext,
} from 'oneprovider-gui/components/file-browser';
import EmberObject, { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import computedT from 'onedata-gui-common/utils/computed-t';
import DownloadInBrowser from 'oneprovider-gui/mixins/download-in-browser';
import { all as allFulfilled, allSettled } from 'rsvp';
import { conditional, equal, raw, and } from 'ember-awesome-macros';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';
import _ from 'lodash';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import ArchiveBrowserListPoller from 'oneprovider-gui/utils/archive-browser-list-poller';
import ColumnsConfiguration from 'oneprovider-gui/utils/columns-configuration';

const allButtonNames = Object.freeze([
  'btnArchiveProperties',
  'btnEditDescription',
  'btnShowAuditLog',
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
  currentUser: service(),

  // required by DownloadInBrowser mixin
  fileManager: service(),
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
   * @override
   */
  disabledColumns: Object.freeze(['owner']),

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
  openArchiveDetailsModal: notImplementedThrow,

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
  headRowTranslation: 'components.archiveBrowser.tableHeadRow',

  /**
   * @override
   */
  headRowClass: 'archive-table-head-row',

  /**
   * @override
   */
  firstColumnClass: 'fb-table-col-archives',

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
   * @override
   */
  browserPersistedConfigurationKey: 'archive',

  /**
   * @type {ComputedProperty<boolean>}
   */
  isAnySelectedDeleting: computed(
    'selectedItems.@each.state',
    function isAnySelectedDeleting() {
      this.selectedItems?.some(item => item && get(item, 'state') === 'deleting');
    }
  ),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isAnySelectedCreating: computed(
    'selectedItems.@each.metaState',
    function isAnySelectedCreating() {
      return this.selectedItems?.some(item =>
        item && get(item, 'metaState') === 'creating'
      );
    }
  ),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isAnySelectedEndedIncomplete: computed(
    'selectedItems.@each.metaState',
    function isAnySelectedEndedIncomplete() {
      return this.selectedItems?.some(item =>
        item && (
          get(item, 'metaState') === 'failed' || get(item, 'metaState') === 'cancelled'
        )
      );
    },
  ),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isAnySelectedCancelling: computed(
    'selectedItems.@each.state',
    function isAnySelectedCancelling() {
      return this.selectedItems.some(archive =>
        get(archive, 'state')?.startsWith('cancelling')
      );
    }
  ),

  areAllSelectedCreatedByCurrentUser: computed(
    'currentUser.userId',
    'selectedItems.@each.creatorId',
    function areAllSelectedCreatedByCurrentUser() {
      const currentUserId = this.currentUser.userId;
      return this.selectedItems.every(archive =>
        get(archive, 'creatorId') === currentUserId
      );
    },
  ),

  selectedArchiveHasDip: and(
    equal('selectedItems.length', raw(1)),
    'selectedItems.0.config.includeDip'
  ),

  //#region Action buttons

  btnCopyId: computed(function btnCopyId() {
    return this.createItemBrowserAction({
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
      return this.createItemBrowserAction({
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
      return this.createItemBrowserAction({
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
      return this.createItemBrowserAction({
        id: 'archiveProperties',
        icon: 'properties',
        action: (archives) => {
          return this.openArchiveDetailsModal(archives[0], { initialTab: 'properties' });
        },
        showIn: [
          actionContext.singleDir,
          actionContext.singleDirPreview,
        ],
      });
    }
  ),

  btnEditDescription: computed(
    'areAllSelectedCreatedByCurrentUser',
    'spacePrivileges.manageArchives',
    function btnEditDescription() {
      const hasPrivileges = this.areAllSelectedCreatedByCurrentUser ||
        this.spacePrivileges.manageArchives;
      let disabledTip;
      if (!hasPrivileges) {
        disabledTip = insufficientPrivilegesMessage({
          i18n: this.i18n,
          modelName: 'space',
          privilegeFlag: ['space_manage_archives'],
          endingTextInParentheses: this.t('forNonOwnedArchives'),
        });
      }
      return this.createItemBrowserAction({
        id: 'editDescription',
        icon: 'browser-rename',
        tip: disabledTip,
        disabled: Boolean(disabledTip),
        action: (archives) => {
          return this.openArchiveDetailsModal(archives[0], {
            initialTab: 'properties',
            properties: { editDescription: true },
          });
        },
        showIn: [
          actionContext.singleDir,
          actionContext.singleDirPreview,
        ],
      });
    }
  ),

  btnShowAuditLog: computed(
    function btnShowAuditLog() {
      return this.createItemBrowserAction({
        id: 'showAuditLog',
        icon: 'view-list',
        action: (archives) => {
          return this.openArchiveDetailsModal(archives[0], {
            initialTab: 'logs',
          });
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
    'spacePrivileges.createArchives',
    function btnCreateArchive() {
      const {
        spacePrivileges,
        i18n,
      } = this.getProperties(
        'spacePrivileges',
        'i18n',
      );
      const hasPrivileges = spacePrivileges.createArchives;
      let disabledTip;
      if (!hasPrivileges) {
        disabledTip = insufficientPrivilegesMessage({
          i18n,
          modelName: 'space',
          privilegeFlag: ['space_create_archives'],
        });
      }
      return this.createItemBrowserAction({
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
          actionContext.rootDir,
        ],
      });
    }
  ),

  btnCreateIncrementalArchive: computed(
    'dataset',
    'attachmentState',
    'spacePrivileges.createArchives',
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
        const hasPrivileges = spacePrivileges.createArchives;
        if (!hasPrivileges) {
          disabledTip = insufficientPrivilegesMessage({
            i18n,
            modelName: 'space',
            privilegeFlag: ['space_create_archives'],
          });
        }
      }
      return this.createItemBrowserAction({
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
    function btnRecall() {
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
      return this.createItemBrowserAction({
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
      return this.createItemBrowserAction({
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
    'spacePrivileges.manageArchives',
    'areAllSelectedCreatedByCurrentUser',
    'isAnySelectedCancelling',
    function btnCancel() {
      let disabledTip;
      const hasPrivileges = this.areAllSelectedCreatedByCurrentUser ||
        this.spacePrivileges.createArchives;
      if (this.isAnySelectedCancelling) {
        disabledTip = this.t('alreadyCancelling');
      } else if (!hasPrivileges) {
        disabledTip = insufficientPrivilegesMessage({
          i18n: this.i18n,
          modelName: 'space',
          privilegeFlag: ['space_manage_archives'],
          endingTextInParentheses: this.t('forNonOwnedArchives'),
        });
      }
      return this.createItemBrowserAction({
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

  /**
   * Fetches datset archives.
   * @override
   */
  async fetchDirChildren(datasetId, startIndex, size, offset) {
    return this.browserizeArchives(await this.archiveManager.fetchDatasetArchives({
      datasetId,
      index: startIndex,
      limit: size,
      offset,
    }));
  },

  // TODO: VFS-10743 Currently not used, but this method may be helpful in not-known
  // items select implementation
  /**
   * @override
   */
  async checkItemExistsInParent(datasetId, archive) {
    const archiveId = get(archive, 'entityId');
    try {
      const archiveRecord = await this.archiveManager
        .getArchive(archiveId, { reload: true });
      return archiveRecord.relationEntityId('dataset') === datasetId;
    } catch {
      return false;
    }
  },

  /**
   * @override
   */
  createBrowserListPoller() {
    return ArchiveBrowserListPoller.create({
      browserModel: this,
    });
  },

  /**
   * @override
   */
  isItemDisabled(item) {
    return item && get(item, 'metaState') === 'destroying';
  },

  /**
   * @override
   */
  createColumnsConfiguration() {
    const columns = {
      state: EmberObject.create({
        isVisible: true,
        isEnabled: true,
        width: 200,
        hasSubname: false,
        hasTooltip: false,
      }),
      incremental: EmberObject.create({
        isVisible: true,
        isEnabled: true,
        width: 180,
        hasSubname: false,
        hasTooltip: false,
      }),
      creator: EmberObject.create({
        isVisible: true,
        isEnabled: true,
        width: 200,
        hasSubname: false,
        hasTooltip: false,
      }),
    };
    const columnsOrder = ['state', 'incremental', 'creator'];
    return ColumnsConfiguration.create({
      configurationType: this.browserPersistedConfigurationKey,
      columns,
      columnsOrder,
      firstColumnWidth: 200,
    });
  },

  async browserizeArchives({ childrenRecords, isLast }) {
    const archiveManager = this.archiveManager;
    return {
      childrenRecords: await allFulfilled(childrenRecords.map(record =>
        archiveManager.getBrowsableArchive(record)
      )),
      isLast,
    };
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
      checkboxMessage: this.t(
        `cancelModal.deleteAfterCancel.${isMultiple ? 'multi' : 'single'}`
      ),
      isCheckboxBlocking: false,
      isCheckboxInitiallyChecked: true,
      onSubmit: async ({ isCheckboxChecked: deleteAfterCancel }) => {
        const submitResult = await this.cancelMultipleArchivization(
          archives,
          deleteAfterCancel
        );
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

  async cancelMultipleArchivization(archives, deleteAfterCancel) {
    const archiveManager = this.archiveManager;
    return await allSettled(archives.map(archive =>
      archiveManager.cancelArchivization(archive, deleteAfterCancel)
    ));
  },
});
