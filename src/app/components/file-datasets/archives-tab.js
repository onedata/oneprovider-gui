/**
 * A container for archives browser embedded into file-datasets panel.
 *
 * @module components/archives-tab
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
   * @virtual optional
   */
  contentScrollSelector: undefined,

  /**
   * @implements InModalBrowserContainerBase
   * @virtual
   */
  modalBodyId: undefined,

  /**
   * @implements ItemBrowserContainerBase
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
   * @virtual optional
   */
  archiveBrowserModelOptions: Object.freeze({}),

  /**
   * @virtual optional
   */
  filesystemBrowserModelOptions: Object.freeze({}),

  /**
   * @implements ArchiveBrowserModel.spaceDatasetsViewState
   */
  attachmentState: 'attached',

  // FIXME: introduce "effArchiveDipMode" that is computed from archive model
  /**
   * One of: aip, dip.
   * @type {String}
   */
  archiveDipMode: 'aip',

  createArchiveOpened: undefined,

  createArchiveOptions: undefined,

  /**
   * One of: archives, files.
   * @type {String}
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

  dir: computedLastProxyContent('dirProxy'),

  /**
   * Just wait for first dirProxy load.
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
   * @implements ArchiveBrowserModel.spaceDatasetsViewState
   */
  browsableDatasetProxy: promise.object(computed('dataset', function browsableDataset() {
    const {
      datasetManager,
      dataset,
    } = this.getProperties('datasetManager', 'dataset');

    return datasetManager.getBrowsableDataset(dataset);
  })),

  browsableDataset: reads('browsableDatasetProxy.content'),

  datasetId: reads('browsableDataset.entityId'),

  /**
   * @type {PromiseObject<Models.Archive>}
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

  archive: computedLastProxyContent('archiveProxy'),

  // FIXME: redundancy
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

  // FIXME: DRY
  getEmptyFetchChildrenResponse() {
    return {
      childrenRecords: [],
      isLast: true,
    };
  },

  // FIXME: DRY
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
    return fileManager.getFileById(fileId, 'private');
  },

  createArchiveBrowserModel(options = {}) {
    return ArchiveBrowserModel.create(Object.assign({
      ownerSource: this,
      spaceDatasetsViewState: this,
      // FIXME: archives url (base archives, DIP etc.)
      getDatasetsUrl: undefined,
      openCreateArchiveModal: this.openCreateArchiveModal.bind(this),
      openPurgeModal: this.openArchivesPurgeModal.bind(this),
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
      // openInfo: this.openInfoModal.bind(this),
      // openMetadata: this.openMetadataModal.bind(this),
      // openShare: this.openShareModal.bind(this),
      // openEditPermissions: this.openEditPermissionsModal.bind(this),
      // openFileDistribution: this.openFileDistributionModal.bind(this),
      // openQos: this.openQosModal.bind(this),
      // openConfirmDownload: this.openConfirmDownload.bind(this),
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

  openArchivesPurgeModal() {
    throw new Error('openPurgeModal not implemented');
  },

  async changeArchiveDipMode(mode) {
    const archiveDipMode = this.get('archiveDipMode');
    // FIXME: proxy may be unnecessary
    const archive = await this.get('archiveProxy');
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

  // FIXME: redundancy with content-space-datasets
  async fetchDatasetArchives(datasetId, startIndex, size, offset) {
    const archiveManager = this.get('archiveManager');
    return this.browserizeArchives(await archiveManager.fetchDatasetArchives({
      datasetId,
      index: startIndex,
      limit: size,
      offset,
    }));
  },

  // FIXME: redundancy with content-space-archives
  async browserizeArchives({ childrenRecords, isLast }) {
    const archiveManager = this.get('archiveManager');
    return {
      childrenRecords: await allFulfilled(childrenRecords.map(record =>
        archiveManager.getBrowsableArchive(get(record, 'entityId'))
      )),
      isLast,
    };
  },

  // FIXME: redundancy with content-space-archives
  async resolveItemParent(item) {
    const itemEntityId = get(item, 'entityId');
    const browsableType = get(item, 'browsableType');
    // // if browsable item has no type, it defaults to file (first and original
    // // browsable object)
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
          const parent = await get(item, 'parent');
          if (get(parent, 'isArchiveRootDir')) {
            const dirParentArchiveId = parent.relationEntityId('archive');
            const dirParentArchive = await get(parent, 'archive');
            const datasetIdOfArchive = dirParentArchive.relationEntityId('dataset');
            const url = this.getDatasetsUrl({
              datasetId: datasetIdOfArchive,
              archive: dirParentArchiveId,
            });
            // TODO: VFS-7850 a workaround for not-updating breadcrumbs,
            // see details in JIRA ticket
            // FIXME:
            throw new Error(`FIXME: VFS-7850: ${url}`);
            // window.top.location = url;
            // window.location.reload();
            // return null;
          }

          return parent;
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
