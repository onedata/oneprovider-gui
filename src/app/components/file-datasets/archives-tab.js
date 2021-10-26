/**
 * A container for archives browser embedded into file-datasets panel.
 *
 * @module components/file-datasets/archives-tab
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { observer, computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { all as allFulfilled } from 'rsvp';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import ItemBrowserContainerBase from 'oneprovider-gui/mixins/item-browser-container-base';
import InModalBrowserContainerBase from 'oneprovider-gui/mixins/in-modal-item-browser-container-base';
import ArchiveBrowserModel from 'oneprovider-gui/utils/archive-browser-model';
import ArchiveFilesystemBrowserModel from 'oneprovider-gui/utils/archive-filesystem-browser-model';
import { promise, conditional, raw, equal } from 'ember-awesome-macros';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import BrowsableArchiveRootDir from 'oneprovider-gui/utils/browsable-archive-root-dir';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';

const mixins = [
  I18n,
  ItemBrowserContainerBase,
  InModalBrowserContainerBase,
];

export default Component.extend(...mixins, {
  classNames: ['file-datasets-archives-tab'],

  archiveManager: service(),
  datasetManager: service(),
  fileManager: service(),
  appProxy: service(),

  /**
   * @type {Models.Space}
   * @virtual
   */
  space: undefined,

  /**
   * @type {Models.Dataset}
   * @virtual
   */
  dataset: undefined,

  /**
   * Custom selector for items list scroll container.
   * Should be overriden **only** if archives-tab is not in one-modal.
   * @type {String}
   * @virtual optional
   */
  contentScrollSelector: undefined,

  /**
   * @implements InModalBrowserContainerBase
   * @type {String}
   * @virtual
   */
  modalBodyId: undefined,

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
  attachmentState: 'attached',

  /**
   * One of: aip, dip.
   * @type {String}
   */
  archiveDipMode: 'aip',

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
   * @type {Models.File}
   */
  fileToShowInfo: null,

  /**
   * One of: general, hardlinks.
   * @type {String}
   */
  showInfoInitialTab: undefined,

  /**
   * @type {Models.File}
   */
  fileToShowMetadata: null,

  /**
   * @type {Models.File}
   */
  fileToShare: null,

  /**
   * In fact, file permissions cannot be edited inside archives, but the modal is named
   * `edit-permissions-modal`, so the property name is compatible with its convention.
   * @type {Array<Models.File>}
   */
  filesToEditPermissions: null,

  /**
   * @type {Array<Models.File>}
   */
  filesToShowDistribution: null,

  /**
   * @type {Array<Models.File>}
   */
  filesToShowQos: null,

  /**
   * @type {Models.File}
   */
  fileForConfirmDownload: null,

  /**
   * @type {Utils.BrowsableArchive}
   */
  archivesToPurge: null,

  //#endregion action modals state

  /**
   * See `Models.Space#spacePrivileges` object format.
   * @type {Object}
   */
  spacePrivileges: reads('space.privileges'),

  /**
   * One of: archives, files.
   * @type {ComputedProperty<String>}
   */
  viewMode: conditional(
    'dirId',
    raw('files'),
    raw('archives'),
  ),

  /**
   * @implements ItemBrowserContainerBase
   */
  dirProxy: promise.object(computed(
    'dirId',
    'browsableDatasetProxy',
    async function dirProxy() {
      const {
        dirId,
        browsableDatasetProxy,
      } = this.getProperties('dirId', 'browsableDatasetProxy');
      if (dirId) {
        return this.fetchDir(dirId);
      } else {
        return browsableDatasetProxy;
      }
    }
  )),

  /**
   * If archive files are browsed, this is the currently opened dir.
   * @type {ComputedProperty<Models.File>}
   */
  dir: computedLastProxyContent('dirProxy'),

  /**
   * @type {ComputedProperty<PromiseObject<BrowsableArchiveRootDir>>}
   */
  archiveRootDirProxy: promise.object(computed(
    'archiveProxy.rootDir',
    'browsableDatasetProxy',
    async function archiveRootDirProxy() {
      const browsableDatasetProxy = this.get('browsableDatasetProxy');
      const archive = await this.get('archiveProxy');
      const rootDir = await get(archive, 'rootDir');
      return BrowsableArchiveRootDir.create({
        content: rootDir,
        hasParent: true,
        parent: browsableDatasetProxy,
        browsableArchive: archive,
      });
    }
  )),

  /**
   * Just wait for first dirProxy load.
   * @type {ComputedProperty<PromiseObject<Models.File>>}
   */
  initialDirProxy: computed(function initialDirProxy() {
    return this.get('dirProxy');
  }),

  /**
   * Proxy for whole file-browser: loading causes loading screen, recomputing causes
   * `file-browser` to be re-rendered.
   * @type {PromiseObject}
   */
  initialRequiredDataProxy: promise.object(promise.all(
    'initialDirProxy',
    'browsableDatasetProxy',
  )),

  /**
   *
   * @type {ComputedProperty<PromiseObject<Utils.BrowsableDataset>>}
   * @implements ArchiveBrowserModel.spaceDatasetsViewState.browsableDatasetProxy
   */
  browsableDatasetProxy: promise.object(computed('dataset', function browsableDataset() {
    const {
      datasetManager,
      dataset,
    } = this.getProperties('datasetManager', 'dataset');

    return datasetManager.getBrowsableDataset(dataset);
  })),

  /**
   * @type {ComputedProperty<Utils.BrowsableDataset>}
   */
  browsableDataset: reads('browsableDatasetProxy.content'),

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

  /**
   * @type {PromiseOBject<EmberObject>} resolve with file-like object for
   *  `file-browser#dir` property
   */
  currentBrowsableItemProxy: conditional(
    equal('viewMode', raw('files')),
    'dirProxy',
    'archiveProxy'
  ),

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
            `component:file-datasets/archives-tab#switchBrowserModel: not supported viewMode: ${viewMode}`
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

  async fetchDir(fileId) {
    return this.getFileById(fileId);
  },

  async fetchChildren(...fetchArgs) {
    const {
      viewMode,
      dirProxy,
    } = this.getProperties(
      'viewMode',
      'dirProxy',
    );
    // a workaround for fb-table trying to get children when it have not-updated "dir"
    if (!get(dirProxy, 'isSettled')) {
      return this.getEmptyFetchChildrenResponse();
    }

    if (viewMode === 'files') {
      return this.fetchDirChildren(...fetchArgs);
    } else if (viewMode === 'archives') {
      return this.fetchDatasetArchives(...fetchArgs);
    }
  },

  // TODO: VFS-7643 make common util for empty response
  getEmptyFetchChildrenResponse() {
    return {
      childrenRecords: [],
      isLast: true,
    };
  },

  // TODO: VFS-7643 maybe fetch dir children will be a common operation in browser model
  async fetchDirChildren(dirId, startIndex, size, offset) {
    const fileManager = this.get('fileManager');
    return fileManager
      .fetchDirChildren(dirId, 'private', startIndex, size, offset);
  },

  /**
   * Should be used as file-browser `getItemById` only in files mode.
   * @param {String} fileId
   * @return {Promise<Models.File|Object>}
   */
  async getFileById(fileId) {
    const fileManager = this.get('fileManager');
    const archive = this.get('archive') || await this.get('archiveProxy');
    const archiveRootDirId = archive.relationEntityId('rootDir');
    if (!fileId || fileId === archiveRootDirId) {
      return this.get('archiveRootDirProxy');
    } else {
      return fileManager.getFileById(fileId, 'private');
    }
  },

  createArchiveBrowserModel(options = {}) {
    return ArchiveBrowserModel.create(Object.assign({
      ownerSource: this,
      spaceDatasetsViewState: this,
      getDatasetsUrl: this.getDatasetsUrl.bind(this),
      openCreateArchiveModal: this.openCreateArchiveModal.bind(this),
      openPurgeModal: this.openArchivesPurgeModal.bind(this),
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
      openMetadata: this.openMetadataModal.bind(this),
      openShare: this.openShareModal.bind(this),
      openEditPermissions: this.openEditPermissionsModal.bind(this),
      openFileDistribution: this.openFileDistributionModal.bind(this),
      openQos: this.openQosModal.bind(this),
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

  /**
   * @param {Array<Models.Archive>} archives
   */
  openArchivesPurgeModal(archives) {
    this.set('archivesToPurge', archives);
  },

  closeArchivesPurgeModal() {
    this.set('archivesToPurge', null);
  },

  openInfoModal(file, activeTab) {
    this.setProperties({
      fileToShowInfo: file,
      showInfoInitialTab: activeTab || 'general',
    });
  },
  closeInfoModal() {
    this.set('fileToShowInfo', null);
  },

  openMetadataModal(file) {
    this.set('fileToShowMetadata', file);
  },

  closeMetadataModal() {
    this.set('fileToShowMetadata', null);
  },

  openShareModal(file) {
    this.set('fileToShare', file);
  },

  closeShareModal() {
    this.set('fileToShare', null);
  },

  openEditPermissionsModal(files) {
    this.set('filesToEditPermissions', [...files]);
  },

  closeEditPermissionsModal() {
    this.set('filesToEditPermissions', null);
  },

  openFileDistributionModal(files) {
    this.set('filesToShowDistribution', [...files]);
  },

  closeFileDistributionModal() {
    this.set('filesToShowDistribution', null);
  },

  openQosModal(files) {
    this.set('filesToShowQos', files);
  },

  closeQosModal() {
    this.set('filesToShowQos', null);
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
   * Open related AIP/DIP archive of currenlty opened archive or provided one.
   * @param {String} mode one of: aip, dip
   * @param {Models.Archive} [relatedArchive] optionally use related archive for opening
   *   its AIP/DIP
   * @returns {Object}
   */
  async changeArchiveDipMode(mode, relatedArchive) {
    const archiveDipMode = this.get('archiveDipMode');
    const archive = relatedArchive || await this.get('archiveProxy');
    if (mode !== archiveDipMode) {
      const newArchiveId = archive.relationEntityId(
        mode === 'dip' ? 'relatedDip' : 'relatedAip'
      );
      this.set('archiveId', newArchiveId);
      const newArchive = await this.get('archiveProxy');
      const newDirId = newArchive.relationEntityId('rootDir');
      return this.setProperties({
        dirId: newDirId,
        archiveId: newArchiveId,
        archiveDipMode: mode,
      });
    }
  },

  // TODO: VFS-7643 maybe it will be a common operation in archive browser model
  async fetchDatasetArchives(datasetId, startIndex, size, offset) {
    const archiveManager = this.get('archiveManager');
    return this.browserizeArchives(await archiveManager.fetchDatasetArchives({
      datasetId,
      index: startIndex,
      limit: size,
      offset,
    }));
  },

  // TODO: VFS-7643 maybe it will be a common operation in archive browser model
  async browserizeArchives({ childrenRecords, isLast }) {
    const archiveManager = this.get('archiveManager');
    return {
      childrenRecords: await allFulfilled(childrenRecords.map(record =>
        archiveManager.getBrowsableArchive(get(record, 'entityId'))
      )),
      isLast,
    };
  },

  // TODO: VFS-7643 remove partial redundancy with content-space-datasets
  async resolveItemParent(item) {
    const itemEntityId = get(item, 'entityId');
    const browsableType = get(item, 'browsableType');
    // if browsable item has no type, it defaults to file (first and original
    // browsable object)
    if (!browsableType || browsableType === 'file') {
      const archive = this.get('archive') || await this.get('archiveProxy');
      const archiveRootDirId = archive && archive.relationEntityId('rootDir');
      if (itemEntityId === archiveRootDirId) {
        return this.get('browsableDatasetProxy');
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
    } else {
      //   // archive or something unknown - display archives browser root (dataset)
      return null;
    }
  },

  async updateDirEntityId(itemId) {
    const {
      viewMode,
      datasetId,
    } = this.getProperties('viewMode', 'datasetId');

    if (viewMode === 'archives') {
      // NOTE: using 2 separate sets because archive getter depends on archiveId
      this.set('archiveId', itemId);
      const archive = await this.get('archiveProxy');
      this.set('dirId', archive.relationEntityId('rootDir'));
    } else if (viewMode === 'files') {
      if (itemId === datasetId) {
        this.setProperties({
          dirId: null,
          archiveId: null,
        });
      } else {
        this.set('dirId', itemId);
      }
    }
  },

  submitArchiveCreate(dataset, archiveData) {
    return this.get('archiveManager').createArchive(dataset, archiveData);
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

  getArchiveFileUrl({ selected }) {
    const {
      archiveId,
      datasetId,
      dirId,
    } = this.getProperties('archiveId', 'datasetId', 'dirId');
    return this.getDatasetsUrl({
      viewMode: 'files',
      datasetId,
      archive: archiveId,
      selected,
      dir: dirId || null,
    });
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
  },
});
