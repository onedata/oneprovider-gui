/**
 * Container with browser of archives and their filesystem for single dataset.
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { observer, computed, get, set } from '@ember/object';
import { reads } from '@ember/object/computed';
import { resolve } from 'rsvp';
import I18n from 'onedata-gui-common/mixins/i18n';
import { inject as service } from '@ember/service';
import ItemBrowserContainerBase from 'oneprovider-gui/mixins/item-browser-container-base';
import ArchiveBrowserModel from 'oneprovider-gui/utils/archive-browser-model';
import ArchiveFilesystemBrowserModel from 'oneprovider-gui/utils/archive-filesystem-browser-model';
import { promise, conditional, raw } from 'ember-awesome-macros';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import BrowsableArchiveRootDir from 'oneprovider-gui/utils/browsable-archive-root-dir';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { isEmpty } from '@ember/utils';
import onlyFulfilledValues from 'onedata-gui-common/utils/only-fulfilled-values';
import FilesViewContext from 'oneprovider-gui/utils/files-view-context';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import InfoModalBrowserSupport from 'oneprovider-gui/mixins/info-modal-browser-support';
import waitForRender from 'onedata-gui-common/utils/wait-for-render';
import FileConsumerMixin from 'oneprovider-gui/mixins/file-consumer';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';
import { getFileGri } from 'oneprovider-gui/models/file';
import {
  destroyDestroyableComputedValues,
  destroyableComputed,
  initDestroyableCache,
} from 'onedata-gui-common/utils/destroyable-computed';

const mixins = [
  I18n,
  ItemBrowserContainerBase,
  InfoModalBrowserSupport,
  FileConsumerMixin,
];

export default Component.extend(...mixins, {
  classNames: ['dataset-archives-browser'],

  archiveManager: service(),
  datasetManager: service(),
  spaceManager: service(),
  fileManager: service(),
  appProxy: service(),
  filesViewResolver: service(),
  parentAppNavigation: service(),

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {ComputedProperty<Utils.BrowsableDataset>}
   */
  browsableDataset: undefined,

  /**
   * @virtual optional
   * @type {Array<String>}
   */
  selectedIds: undefined,

  /**
   * @virtual optional
   * @type {FilesystemBrowserModel.Command}
   */
  fileAction: null,

  /**
   * Scrollable file browser container passed to `file-browser` component.
   * See `component:file-browser#contentScroll` property for details.
   * @virtual optional
   * @type {HTMLElement}
   */
  contentScroll: undefined,

  /**
   * See `component:file-browser#ignoreDeselectSelector` property.
   * @virtual optional
   * @type {String}
   */
  ignoreDeselectSelector: '',

  /**
   * Passed to `file-browser#showSelectionToolkit`.
   * @virtual optional
   * @type {Boolean|Object}
   */
  showSelectionToolkit: true,

  /**
   * If true, navigate to archive recalling target file when recall sucessfully starts.
   * @virtual optional
   * @type {Boolean}
   */
  navigateAfterRecall: false,

  /**
   * Used by `fileActionObserver` to prevent multiple async invocations which is unsafe.
   * @type {boolean}
   */
  fileActionObserverLock: false,

  /**
   * @virtual optional
   * @type {(archiveId: String) => (Promise|undefined)}
   */
  onUpdateArchiveId: computed({
    get() {
      return this.customOnUpdateArchiveId || this.defaultOnUpdateArchiveId;
    },
    set(key, value) {
      return this.customOnUpdateArchiveId = value;
    },
  }),

  /**
   * @virtual optional
   * @type {(archiveId: String) => (Promise|undefined)}
   */
  onUpdateDirId: computed({
    get() {
      return this.customOnUpdateDirId || this.defaultOnUpdateDirId;
    },
    set(key, value) {
      return this.customOnUpdateDirId = value;
    },
  }),

  /**
   * @virtual optional
   * @type {Function}
   */
  onRegisterApi: notImplementedIgnore,

  /**
   * @virtual optional
   * @type {Function}
   */
  onCloseAllModals: notImplementedIgnore,

  /**
   * Entity ID of directory (file model).
   * @type {String}
   */
  dirId: undefined,

  /**
   * Currently opened archive ID (`undefined` if no archive is opened).
   * @type {String}
   */
  archiveId: undefined,

  /**
   * Additional properties for `ArchiveBrowserModel` on model creation.
   * @virtual optional
   */
  archiveBrowserModelOptions: Object.freeze({}),

  /**
   * Additional properties for `ArchiveFilesystemBrowserModel` on model creation.
   * @virtual optional
   */
  filesystemBrowserModelOptions: Object.freeze({}),

  /**
   * @type {Function|undefined}
   */
  customOnUpdateArchiveId: undefined,

  /**
   * @type {(archiveId: String) => (Promise|undefined)}
   */
  customOnUpdateDirId: undefined,

  /**
   * Set the browsable archive object immediately when user opens it using archive browser
   * to be available for archive filesystem browser.
   * @type {Utils.BrowsableArchive}
   */
  openedArchive: undefined,

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  usedFileGris: reads('selectedFileGris'),

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  fileRequirements: computed('selectedFileGris', function fileRequirements() {
    if (!this.selectedFileGris) {
      return [];
    }
    return this.selectedFileGris.map(fileGri =>
      new FileRequirement({
        fileGri,
        properties: ['index'],
      })
    );
  }),

  /**
   * @implements ArchiveBrowserModel.spaceDatasetsViewState
   */
  attachmentState: reads('browsableDataset.state'),

  //#region action modals state

  // Below properties are used to configure items action modals embedded into template.

  /**
   * @type {Boolean}
   */
  createArchiveOpened: undefined,

  /**
   * See `ArchiveManager.createArchive` `data` argument.
   * @type {Object}
   */
  createArchiveOptions: undefined,

  /**
   * @type {Utils.BrowsableArchive}
   */
  archiveToShowDetails: null,

  /**
   * @type {ArchiveFormOptions}
   */
  archiveDetailsOptions: null,

  /**
   * @type {FileInfoTabId} activeTab
   */
  showInfoInitialTab: undefined,

  /**
   * @type {Models.File}
   */
  fileForConfirmDownload: null,

  /**
   * @type {Utils.BrowsableArchive}
   */
  archivesToDelete: null,

  /**
   * @type {Utils.BrowsableArchive}
   */
  archivesToCancel: null,

  /**
   * @type {Utils.BrowsableArchive}
   */
  archivesToShowSettings: null,

  //#endregion action modals state

  selectedFileGris: computed(
    'dirId',
    'selectedIds',
    function selectedFileGris() {
      if (!this.dirId || !Array.isArray(this.selectedIds)) {
        return [];
      }
      return this.selectedIds.map(fileId => {
        return getFileGri(fileId, 'private');
      });
    }),

  spaceId: reads('space.entityId'),

  /**
   * @type {ComputedProperty<SpacePrivileges>}
   */
  spacePrivileges: reads('space.privileges'),

  /**
   * @type {ComputedProperty<Function>}
   */
  defaultOnUpdateArchiveId: computed(function defaultOnUpdateArchiveId() {
    return (archiveId) => {
      // This line is wrongly treated as a side effect in computed, but it is a
      // function implementation.
      // eslint-disable-next-line ember/no-side-effects
      this.set('archiveId', archiveId);
    };
  }),

  /**
   * @type {ComputedProperty<(fileId: String) => (Promise|undefined)>}
   */
  defaultOnUpdateDirId: computed(function defaultOnUpdateDirId() {
    return (dirId) => {
      // This line is wrongly treated as a side effect in computed, but it is a
      // function implementation.
      // eslint-disable-next-line ember/no-side-effects
      this.set('dirId', dirId);
    };
  }),

  /**
   * One of: archives, files.
   * @type {ComputedProperty<String>}
   */
  viewMode: conditional(
    'archiveId',
    raw('files'),
    raw('archives'),
  ),

  /**
   * One of: aip, dip.
   * @type {String}
   */
  archiveDipModeProxy: promise.object(computed(
    'archiveProxy',
    async function archiveDipMode() {
      const archive = await this.get('archiveProxy');
      if (archive) {
        return archive.relationEntityId('relatedAip') ? 'dip' : 'aip';
      }
    }
  )),

  archiveDipMode: reads('archiveDipModeProxy.content'),

  /**
   * @implements ItemBrowserContainerBase
   */
  dirProxy: computed('datasetId', 'dirId', 'archiveProxy', function dirProxy() {
    const {
      archiveProxy,
      spaceId,
      datasetId,
      archiveId,
      archiveRootDirProxy,
      dirId,
      selectedIds,
    } = this;

    const promise = (async () => {
      if (!archiveId) {
        return null;
      }

      const archive = await archiveProxy;

      // Special case: if archive is nested, do not check if directory is from current
      // archive and dataset, because we can browse nested archives and in current
      // implementation we don't have enough information to check if directory is in
      // nested archive.
      const isNestedArchive = archive && get(archive, 'config.createNestedArchives');
      const currentFilesViewContext = isNestedArchive ?
        null :
        FilesViewContext.create({
          spaceId,
          datasetId,
          archiveId,
        });
      const archiveRootDir = await archiveRootDirProxy;
      const resolverResult = await this.filesViewResolver.resolveViewOptions({
        dirId,
        currentFilesViewContext,
        selectedIds,
        scope: 'private',
        fallbackDir: archiveRootDir,
      });

      if (!resolverResult) {
        return null;
      }
      if (resolverResult.result === 'resolve') {
        if (await this.isArchiveRootDir(resolverResult.dir)) {
          return archiveRootDirProxy;
        } else {
          return resolverResult.dir;
        }
      } else {
        if (resolverResult.url) {
          this.parentAppNavigation.openUrl(resolverResult.url, true);
        }
        return archiveRootDir;
      }
    })();

    return promiseObject(promise);
  }),

  /**
   * @implements ItemBrowserContainerProxy
   */
  currentBrowsableItemProxy: computed(
    'viewMode',
    'dirProxy',
    'browsableDatasetProxy',
    function currentBrowsableItemProxy() {
      return this.viewMode === 'files' ? this.dirProxy : this.browsableDatasetProxy;
    }
  ),

  /**
   * Fake proxy resolving immediately to be compatible with `dirProxy` for file browser.
   * @type {PromiseObject<Utils.BrowsableDataset>}
   */
  browsableDatasetProxy: computed('browsableDataset', function browsableDatasetProxy() {
    return promiseObject(resolve(this.browsableDataset));
  }),

  /**
   * @type {ComputedProperty<PromiseObject<BrowsableArchiveRootDir>>}
   */
  archiveRootDirProxy: promise.object(computed(
    'archiveProxy.rootDir',
    'browsableDataset',
    async function archiveRootDirProxy() {
      const {
        archiveProxy,
        browsableDataset,
      } = this.getProperties('archiveProxy', 'browsableDataset');
      const archive = await archiveProxy;
      if (!archive) {
        return;
      }
      const rootDir = await get(archive, 'rootDir');
      return BrowsableArchiveRootDir.create({
        content: rootDir,
        hasParent: true,
        parent: promiseObject(resolve(browsableDataset)),
        browsableArchive: archive,
      });
    }
  )),

  /**
   * Directory to be viewed on component load - this proxy not recomputes on every dir
   * change.
   * @type {PromiseObject<Models.File>}
   */
  initialBrowsableItemProxy: promise.object(computed(
    'space',
    'browsableDataset',
    async function initialBrowsableItemProxy() {
      return this.currentBrowsableItemProxy;
    }
  )),

  /**
   * Proxy for whole file-browser: loading causes loading screen, recomputing causes
   * `file-browser` to be re-rendered.
   * @type {PromiseObject}
   */
  initialRequiredDataProxy: promise.object(promise.all(
    'selectedFilesForJumpProxy',
    'selectedArchivesForJumpProxy',
    'initialBrowsableItemProxy',
    'dirStatsServiceStateProxy',
    'archiveProxy',
  )),

  /**
   * @type {ComputedProperty<String>}
   */
  datasetId: reads('browsableDataset.entityId'),

  /**
   * @type {PromiseObject<Utils.BrowsableArchive>}
   */
  archiveProxy: promise.object(computed(
    'archiveId',
    async function archiveProxy() {
      if (this.archiveId) {
        return this.archiveManager.getBrowsableArchive(this.archiveId);
      } else {
        return null;
      }
    }
  )),

  /**
   * If archive files are browsed, this is the currently selected archive for browse.
   * @type {ComputedProperty<Utils.BrowsableArchive>}
   */
  archive: computedLastProxyContent('archiveProxy'),

  // NOTE: not observing archiveId, because jump should not be performed if archiveId
  // changes
  selectedFilesForJumpProxy: computed(
    'selectedIds',
    function selectedFilesForJumpProxy() {
      return promiseObject(resolve(
        this.archiveId ? this.getFilesForView(this.selectedIds) : []
      ));
    }
  ),

  // NOTE: not observing archiveId, because jump should not be performed if archiveId
  // changes
  selectedArchivesForJumpProxy: computed(
    'selectedIds',
    function selectedArchivesForJumpProxy() {
      return promiseObject(resolve(
        this.archiveId ? [] : this.getArchivesForView(this.selectedIds)
      ));
    }
  ),

  dirStatsServiceStateProxy: promise.object(computed(
    'space.entityId',
    function dirStatsServiceStateProxy() {
      return this.space &&
        this.spaceManager.getDirStatsServiceState(get(this.space, 'entityId'));
    }
  )),

  /**
   * @implements {Mixins.ItemBrowserContainerBase}
   * @type {ComputedProperty<Utils.ArchiveFilesystemBrowserModel|Utils.ArchiveBrowserModel>}
   */
  browserModel: destroyableComputed(
    'viewMode',
    'archiveDipMode',
    function browserModel() {
      switch (this.viewMode) {
        case 'files':
          return this.createFilesystemBrowserModel(this.filesystemBrowserModelOptions);
        case 'archives':
          return this.createArchiveBrowserModel(this.archiveBrowserModelOptions);
        default:
          throw new Error(
            `component:dataset-archives-browser#browserModel: not supported viewMode: ${this.viewMode}`
          );
      }
    }
  ),

  fileActionObserver: observer(
    'fileAction',
    // additional properties, that should invoke file action from URL
    'selected',
    'viewMode',
    function fileActionObserver() {
      if (this.viewMode !== 'files' || !this.fileAction || this.fileActionObserverLock) {
        return;
      }
      this.set('fileActionObserverLock', true);
      (async () => {
        try {
          await this.initialRequiredDataProxy;
          await this.dirProxy;
          await this.browserModel.itemsArray.initialLoad;
          await waitForRender();
          this.browserModel.invokeCommand(this.fileAction);
        } finally {
          safeExec(this, () => {
            this.appProxy.callParent('updateFileAction', null);
            this.set('fileActionObserverLock', false);
          });
        }
      })();
    }
  ),

  init() {
    initDestroyableCache(this);
    this._super(...arguments);
    this.fileActionObserver();
  },

  willDestroyElement() {
    try {
      destroyDestroyableComputedValues(this);
    } finally {
      this._super(...arguments);
    }
  },

  async getFilesForView(ids) {
    if (!ids) {
      return [];
    }

    const {
      fileManager,
      spaceId,
    } = this.getProperties('fileManager', 'spaceId');
    const files =
      await onlyFulfilledValues(ids.map(id =>
        fileManager.getFileById(id)
      ));
    try {
      // allow only files which belong to current space
      return files.filter(file => get(file, 'spaceEntityId') === spaceId);
    } catch (error) {
      return [];
    }
  },

  async getArchivesForView(ids) {
    if (!ids) {
      return [];
    }

    const {
      archiveManager,
      datasetId,
    } = this.getProperties('archiveManager', 'datasetId');
    const items =
      await onlyFulfilledValues(ids.map(id =>
        archiveManager.getBrowsableArchive(id)
      ));
    try {
      // allow only archives which belong to current dataset
      return items.filter(item => item.relationEntityId('dataset') === datasetId);
    } catch (error) {
      return [];
    }
  },

  async fetchDir(fileId) {
    return this.getFileById(fileId);
  },

  /**
   * Should be used as file-browser `getItemById` only in files mode.
   * @param {String} fileId
   * @returns {Promise<Models.File|Object>}
   */
  async getFileById(fileId) {
    const archive = this.openedArchive || this.archive || await this.archiveProxy;
    const archiveRootDirId = archive.relationEntityId('rootDir');
    if (!fileId || fileId === archiveRootDirId) {
      return this.archiveRootDirProxy;
    } else {
      return this.fileManager.getFileById(fileId, { scope: 'private' });
    }
  },

  createArchiveBrowserModel(options = {}) {
    return DatasetArchivesArchiveBrowserModel.create(Object.assign({
      datasetArchivesBrowser: this,
      ownerSource: this,
      spaceDatasetsViewState: this,
      getDatasetsUrl: this.getDatasetsUrl.bind(this),
      openCreateArchiveModal: this.openCreateArchiveModal.bind(this),
      openDeleteModal: this.openArchivesDeleteModal.bind(this),
      openRecallModal: this.openArchiveRecallModal.bind(this),
      openArchiveDetailsModal: this.openArchiveDetailsModal.bind(this),
      browseArchiveDip: this.browseArchiveDip.bind(this),
    }, options));
  },

  createFilesystemBrowserModel(options) {
    if (!this.openedArchive && !this.archiveProxy.isFulfilled) {
      throw new Error(
        'DatasetArchivesBrowser.createFilesystemBrowserModel: no archive provided'
      );
    }
    return DatasetArchivesFilesystemBrowserModel.create({
      datasetArchivesBrowser: this,
      ownerSource: this,
      archive: this.openedArchive || this.archiveProxy.content,
      onDirectoryChanged: () => this.onCloseAllModals(),
      onArchiveDipModeChange: this.changeArchiveDipMode.bind(this),
      openInfo: this.openInfoModal.bind(this),
      openConfirmDownload: this.openConfirmDownload.bind(this),
      ...options,
    });
  },

  /**
   * @param {Models.Dataset} dataset dataset for which create archive form will be shown
   * @param {Object} options
   */
  openCreateArchiveModal(dataset, options) {
    this.setProperties({
      createArchiveOpened: true,
      createArchiveOptions: options,
    });
  },

  closeCreateArchiveModal() {
    this.setProperties({
      createArchiveOpened: false,
      createArchiveOptions: null,
    });
  },

  openArchiveDetailsModal(archive, options) {
    this.setProperties({
      archiveToShowDetails: archive,
      archiveDetailsOptions: options,
    });
  },

  closeArchivePropertiesModal() {
    this.setProperties({
      archiveToShowDetails: null,
      archiveDetailsOptions: null,
    });
  },

  /**
   * @param {Array<Models.Archive>} archives
   */
  openArchivesDeleteModal(archives) {
    this.set('archivesToDelete', archives);
  },

  closeArchivesDeleteModal() {
    this.set('archivesToDelete', null);
  },

  openConfirmDownload(file) {
    this.set('fileForConfirmDownload', file);
  },

  closeConfirmFileDownload() {
    this.set('fileForConfirmDownload', null);
  },

  confirmFileDownload() {
    return this.get('browserModel')
      .downloadFiles([
        this.get('fileForConfirmDownload'),
      ])
      .finally(() => {
        safeExec(this, 'set', 'fileForConfirmDownload', null);
      });
  },

  browseArchiveDip(archive) {
    this.changeArchiveDipMode('dip', archive);
  },

  /**
   * Open related AIP/DIP archive of currently opened archive or provided one.
   * @param {String} mode one of: aip, dip
   * @param {Models.Archive} [relatedArchive] optionally use related archive for opening
   *   its AIP/DIP
   */
  async changeArchiveDipMode(mode, relatedArchive) {
    const {
      archiveDipModeProxy,
      onUpdateArchiveId,
      onUpdateDirId,
    } = this.getProperties('archiveDipModeProxy', 'onUpdateArchiveId', 'onUpdateDirId');
    const archiveDipMode = await archiveDipModeProxy;
    if (mode !== archiveDipMode) {
      const archive = relatedArchive || await this.get('archiveProxy');
      const newArchiveId = archive.relationEntityId(
        mode === 'dip' ? 'relatedDip' : 'relatedAip'
      );
      onUpdateDirId(null);
      await onUpdateArchiveId(newArchiveId);
    }
  },

  // TODO: VFS-7643 remove partial redundancy with content-space-datasets
  async resolveItemParent(item) {
    if (!item) {
      return null;
    }
    const {
      archive: lastResolvedArchive,
      archiveProxy,
      browsableDataset,
    } = this.getProperties(
      'archive',
      'archiveProxy',
      'browsableDataset',
    );
    const itemEntityId = get(item, 'entityId');
    const browsableType = get(item, 'browsableType');
    // if browsable item has no type, it defaults to file (first and original
    // browsable object)
    if (!browsableType || browsableType === 'file') {
      const archive = lastResolvedArchive || await archiveProxy;
      const archiveRootDirId = archive && archive.relationEntityId('rootDir');
      if (itemEntityId === archiveRootDirId) {
        return browsableDataset;
      } else if (get(item, 'hasParent')) {
        // file browser: it's a subdir
        if (item.relationEntityId('parent') === archiveRootDirId) {
          // file browser: it's a direct child of archive root dir
          // return wrapped archive root dir (for special name and parent)
          const browsableArchiveRootDir = await this.archiveRootDirProxy;
          return browsableArchiveRootDir;
        } else {
          // file browser: inside archive filesystem
          return get(item, 'parent');
        }
      } else {
        // file browser: it's rather some problem with getting dir parent,
        // so resolve archive root dir
        console.warn(
          'component:content-space-datasets: cannot resolve dir parent, fallback to rootDir'
        );
        return get(archive, 'rootDir');
      }
    } else if (browsableType === 'archive') {
      // archive - display archives browser root (dataset)
      return browsableDataset;
    } else {
      // dataset (root of breadcrumbs) or something unknown - stop iteration
      return null;
    }
  },

  async isArchiveRootDir(item) {
    const lastResolvedArchive = this.archive;
    const archive = lastResolvedArchive || await this.archiveProxy;
    const archiveRootDirId = archive?.relationEntityId('rootDir');
    return get(item, 'entityId') === archiveRootDirId;
  },

  async updateDirEntityId(itemId) {
    const {
      viewMode,
      datasetId,
      onUpdateArchiveId,
      onUpdateDirId,
    } = this.getProperties(
      'viewMode',
      'datasetId',
      'onUpdateArchiveId',
      'onUpdateDirId'
    );

    if (itemId === datasetId) {
      onUpdateDirId(null);
      await onUpdateArchiveId(null);
    } else if (viewMode === 'archives') {
      onUpdateDirId(null);
      await onUpdateArchiveId(itemId);
    } else if (viewMode === 'files') {
      await onUpdateDirId(itemId);
    }
  },

  submitArchiveCreate(dataset, archiveData) {
    return this.get('archiveManager').createArchive(dataset, archiveData);
  },

  openArchiveRecallModal(archive) {
    this.set('archiveToRecall', archive);
  },

  closeArchiveRecallModal() {
    this.set('archiveToRecall', null);
  },

  /**
   * @param {RecallArchiveResponse} result
   */
  async handleArchiveRecallStarted(result) {
    if (!this.get('navigateAfterRecall') || !result || !result.rootFileId) {
      return;
    }
    const {
      parentAppNavigation,
      filesViewResolver,
    } = this.getProperties('parentAppNavigation', 'filesViewResolver');
    const rootFileId = result.rootFileId;
    const url = await filesViewResolver.generateUrlById(rootFileId);
    if (url) {
      parentAppNavigation.openUrl(url);
    }
  },

  getItemById(itemId) {
    return this.get('fileManager').getFileById(itemId, { scope: 'private' });
  },

  //#region URL generating methods

  getDatasetsUrl(options) {
    return this.get('appProxy').callParent('getDatasetsUrl', options);
  },

  getShareUrl(options) {
    return this.get('appProxy').callParent('getShareUrl', options);
  },

  getTransfersUrl(options) {
    return this.get('appProxy').callParent('getTransfersUrl', options);
  },
  getProvidersUrl(options) {
    return this.get('appProxy').callParent('getProvidersUrl', options);
  },

  //#endregion

  actions: {
    resolveItemParent() {
      return this.resolveItemParent(...arguments);
    },
    fetchChildren() {
      return this.fetchChildren(...arguments);
    },
    changeSelectedItems(selectedItems) {
      return this.browserModel.changeSelectedItems(selectedItems);
    },
    updateDirEntityId() {
      return this.updateDirEntityId(...arguments);
    },
    /**
     * @param {Object} data
     * @param {String} data.fileId entity id of directory to open
     * @param {String|Array<String>} data.selected list of entity ids of files
     *  to be selected on view
     * @returns {String}
     */
    async getFileUrl({ fileId, selected }) {
      let id;
      let type;
      if (isEmpty(selected)) {
        id = fileId;
        type = 'open';
      } else {
        id = selected[0];
        type = 'select';
      }
      return this.get('filesViewResolver').generateUrlById(id, type);
    },
    getProvidersUrl(...args) {
      return this.getProvidersUrl(...args);
    },
  },
});

const DatasetArchivesArchiveBrowserModel = ArchiveBrowserModel.extend({
  /**
   * @virtual
   * @type {Component.DatasetArchivesBrowser}
   */
  datasetArchivesBrowser: undefined,

  dirProxy: reads('datasetArchivesBrowser.browsableDatasetProxy'),
  selectedItemsForJump: reads(
    'datasetArchivesBrowser.selectedArchivesForJumpProxy.content'
  ),

  /**
   * @override
   */
  async onWillChangeDir(targetDir, updateBrowserDir) {
    set(this.datasetArchivesBrowser, 'openedArchive', targetDir);
    await updateBrowserDir?.(targetDir);
  },
});

const DatasetArchivesFilesystemBrowserModel = ArchiveFilesystemBrowserModel.extend({
  /**
   * @virtual
   * @type {Component.DatasetArchivesBrowser}
   */
  datasetArchivesBrowser: undefined,

  /**
   * @virtual
   */
  onArchiveDipModeChange: undefined,

  /**
   * @virtual
   */
  openInfo: undefined,

  /**
   * @virtual
   */
  openConfirmDownload: undefined,

  dirProxy: reads('datasetArchivesBrowser.dirProxy'),
  archiveDipMode: reads('datasetArchivesBrowser.archiveDipMode'),
  selectedItemsForJump: reads('datasetArchivesBrowser.selectedFilesForJumpProxy.content'),
  renderArchiveDipSwitch: true,
  // TODO: VFS-7406 use dir or file-dataset icons
  rootIcon: 'browser-dataset',
  downloadScope: 'private',
});
