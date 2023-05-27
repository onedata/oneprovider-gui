/**
 * Container with browser of archives and their filesystem for single dataset.
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { observer, computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { resolve } from 'rsvp';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import ItemBrowserContainerBase from 'oneprovider-gui/mixins/item-browser-container-base';
import ArchiveBrowserModel from 'oneprovider-gui/utils/archive-browser-model';
import ArchiveFilesystemBrowserModel from 'oneprovider-gui/utils/archive-filesystem-browser-model';
import { promise, conditional, raw, equal } from 'ember-awesome-macros';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import BrowsableArchiveRootDir from 'oneprovider-gui/utils/browsable-archive-root-dir';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { isEmpty } from '@ember/utils';
import onlyFulfilledValues from 'onedata-gui-common/utils/only-fulfilled-values';
import FilesViewContext from 'oneprovider-gui/utils/files-view-context';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import InfoModalBrowserSupport from 'oneprovider-gui/mixins/info-modal-browser-support';

const mixins = [
  I18n,
  ItemBrowserContainerBase,
  InfoModalBrowserSupport,
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
   * @virtual optional
   * @type {(archiveId: String) => (Promise|undefined)}
   */
  onUpdateArchiveId: computed(function onUpdateArchiveId() {
    return (archiveId) => {
      this.set('archiveId', archiveId);
    };
  }),

  /**
   * @virtual optional
   * @type {(fileId: String) => (Promise|undefined)}
   */
  onUpdateDirId: computed(function onUpdateDirId() {
    return (dirId) => {
      this.set('dirId', dirId);
    };
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
   * @implements ItemBrowserContainerBase.selectedItems
   */
  selectedItems: undefined,

  /**
   * Managed by `switchBrowserModel` observer.
   * @type {Utils.BaseBrowserModel}
   */
  browserModel: undefined,

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

  spaceId: reads('space.entityId'),

  /**
   * @type {ComputedProperty<SpacePrivileges>}
   */
  spacePrivileges: reads('space.privileges'),

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
  dirProxy: promise.object(computed(
    'datasetId',
    'dirId',
    'archiveProxy',
    async function dirProxy() {
      if (!this.get('archiveId')) {
        return;
      }

      const {
        spaceId,
        datasetId,
        dirId,
        archiveId,
        filesViewResolver,
        archiveProxy,
        archiveRootDirProxy,
        selectedIds,
        parentAppNavigation,
      } = this.getProperties(
        'spaceId',
        'datasetId',
        'dirId',
        'archiveId',
        'filesViewResolver',
        'archiveProxy',
        'archiveRootDirProxy',
        'selectedIds',
        'parentAppNavigation',
      );
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
      const resolverResult = await filesViewResolver.resolveViewOptions({
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
        return resolverResult.dir;
      } else {
        if (resolverResult.url) {
          parentAppNavigation.openUrl(resolverResult.url, true);
        }
        return archiveRootDir;
      }
    }
  )),

  /**
   * If archive files are browsed, this is the currently opened dir.
   * @type {ComputedProperty<Models.File>}
   */
  dir: computedLastProxyContent('dirProxy'),

  /**
   * Exisiting proxies must be wrapped in new promise object to properly detect changes.
   * @implements ItemBrowserContainerProxy
   */
  currentBrowsableItemProxy: promise.object(conditional(
    equal('viewMode', raw('files')),
    'dirProxy',
    promise.resolve('browsableDataset')
  )),

  currentBrowsableItem: computedLastProxyContent('currentBrowsableItemProxy'),

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
      return this.get('currentBrowsableItemProxy');
    }
  )),

  /**
   * Proxy for whole file-browser: loading causes loading screen, recomputing causes
   * `file-browser` to be re-rendered.
   * @type {PromiseObject}
   */
  initialRequiredDataProxy: promise.object(promise.all(
    'initialBrowsableItemProxy',
    'dirStatsServiceStateProxy'
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
      const {
        archiveManager,
        archiveId,
      } = this.getProperties('archiveManager', 'archiveId');
      if (archiveId) {
        return archiveManager.getBrowsableArchive(archiveId);
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

  selectedItemsForJumpProxy: promise.object(computed(
    // NOTE: not observing archiveId, because jump should not be performed if archiveId
    // changes
    'selectedIds',
    async function selectedItemsForJumpProxy() {
      const {
        selectedIds,
        archiveId,
      } = this.getProperties('selectedIds', 'archiveId');
      if (archiveId) {
        return this.getFilesForView(selectedIds);
      } else {
        return this.getArchivesForView(selectedIds);
      }
    }
  )),

  dirStatsServiceStateProxy: promise.object(computed(
    'space.entityId',
    function dirStatsServiceStateProxy() {
      const {
        spaceManager,
        space,
      } = this.getProperties('spaceManager', 'space');
      return space && spaceManager.getDirStatsServiceState(get(space, 'entityId'));
    }
  )),

  switchBrowserModel: observer(
    'viewMode',
    'archiveDipMode',
    async function switchBrowserModel() {
      const {
        viewMode,
        browserModel: currentBrowserModel,
        archiveBrowserModelOptions,
        filesystemBrowserModelOptions,
      } = this.getProperties(
        'viewMode',
        'browserModel',
        'archiveBrowserModelOptions',
        'fileBrowserModelOptions',
      );
      let newBrowserModel;
      switch (viewMode) {
        case 'files':
          newBrowserModel =
            await this.createFilesystemBrowserModel(filesystemBrowserModelOptions);
          break;
        case 'archives':
          newBrowserModel = this.createArchiveBrowserModel(archiveBrowserModelOptions);
          break;
        default:
          throw new Error(
            `component:dataset-archives-browser#switchBrowserModel: not supported viewMode: ${viewMode}`
          );
      }
      this.set('browserModel', newBrowserModel);
      if (currentBrowserModel) {
        currentBrowserModel.destroy();
      }
    }
  ),

  init() {
    this._super(...arguments);
    this.switchBrowserModel();
  },

  willDestroyElement() {
    try {
      const browserModel = this.get('browserModel');
      if (browserModel) {
        browserModel.destroy();
      }
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
    const fileManager = this.get('fileManager');
    const archive = this.get('archive') || await this.get('archiveProxy');
    const archiveRootDirId = archive.relationEntityId('rootDir');
    if (!fileId || fileId === archiveRootDirId) {
      return this.get('archiveRootDirProxy');
    } else {
      return fileManager.getFileById(fileId, { scope: 'private' });
    }
  },

  createArchiveBrowserModel(options = {}) {
    return ArchiveBrowserModel.create(Object.assign({
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

  async createFilesystemBrowserModel(options) {
    const {
      archiveProxy,
      filesBrowserModelClass,
    } = this.getProperties('archiveProxy', 'filesBrowserModelClass');
    return filesBrowserModelClass.create(
      Object.assign({
        ownerSource: this,
        archive: await archiveProxy,
        onDirectoryChanged: () => this.get('onCloseAllModals')(),
      }, options)
    );
  },

  filesBrowserModelClass: computed(function filesBrowserModelClass() {
    return ArchiveFilesystemBrowserModel.extend({
      renderArchiveDipSwitch: true,
      // TODO: VFS-7406 use dir or file-dataset icons
      rootIcon: 'browser-dataset',
      downloadScope: 'private',
      archiveDipMode: reads('ownerSource.archiveDipMode'),
      onArchiveDipModeChange: this.changeArchiveDipMode.bind(this),
      openInfo: this.openInfoModal.bind(this),
      openConfirmDownload: this.openConfirmDownload.bind(this),
    });
  }),

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
          return this.get('archiveRootDirProxy');
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
      return this.changeSelectedItems(selectedItems);
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
