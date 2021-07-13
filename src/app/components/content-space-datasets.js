/**
 * Container for browsing and managing datasets.
 *
 * @module component/content-space-datasets
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OneEmbeddedComponent from 'oneprovider-gui/components/one-embedded-component';
import { inject as service } from '@ember/service';
import EmberObject, { computed, get, observer, getProperties } from '@ember/object';
import { reads } from '@ember/object/computed';
import ContentSpaceBaseMixin from 'oneprovider-gui/mixins/content-space-base';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { promise, raw, bool, equal, conditional } from 'ember-awesome-macros';
import { resolve, all as allFulfilled } from 'rsvp';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import BrowsableDataset from 'oneprovider-gui/utils/browsable-dataset';
import BrowsableArchiveRootDir from 'oneprovider-gui/utils/browsable-archive-root-dir';
import DatasetBrowserModel from 'oneprovider-gui/utils/dataset-browser-model';
import ArchiveBrowserModel from 'oneprovider-gui/utils/archive-browser-model';
import ArchiveFilesystemBrowserModel from 'oneprovider-gui/utils/archive-filesystem-browser-model';
import { next } from '@ember/runloop';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import onlyFulfilledValues from 'onedata-gui-common/utils/only-fulfilled-values';

export const spaceDatasetsRootId = 'spaceDatasetsRoot';

export const SpaceDatasetsRootBaseClass = EmberObject.extend({
  // dataset-like properties
  id: spaceDatasetsRootId,
  entityId: spaceDatasetsRootId,
  parent: promise.object(raw(resolve(null))),
  hasParent: false,
  protectionFlags: Object.freeze([]),
  rootFile: promise.object(raw(resolve(null))),
  rootFilePath: '/',
  rootFileType: 'dir',

  // special properties
  isDatasetsRoot: true,

  // virtual properties
  name: undefined,
  state: undefined,

  // dataset-like methods
  relationEntityId( /*relation*/ ) {
    return null;
  },
});

export const SpaceDatasetsRootClass = BrowsableDataset.extend({
  content: SpaceDatasetsRootBaseClass.create(),
});

const mixins = [
  I18n,
  ContentSpaceBaseMixin,
];

export default OneEmbeddedComponent.extend(...mixins, {
  classNames: ['content-space-datasets'],

  /**
   * @override
   */
  i18nPrefix: 'components.contentSpaceDatasets',

  datasetManager: service(),
  spaceManager: service(),
  globalNotify: service(),
  archiveManager: service(),
  fileManager: service(),

  /**
   * **Injected from parent frame.**
   * @virtual
   * @type {String}
   */
  spaceId: undefined,

  /**
   * **Injected from parent frame.**
   * @virtual optional
   * @type {String}
   */
  datasetId: undefined,

  /**
   * **Injected from parent frame.**
   * @virtual optional
   * @type {String}
   */
  archiveId: undefined,

  /**
   * **Injected from parent frame.**
   * @virtual optional
   * @type {String}
   */
  dirId: undefined,

  /**
   * **Injected from parent frame.**
   * @virtual optional
   * @type {Array<String>}
   */
  selected: undefined,

  /**
   * One of: 'attached', 'detached'
   * 
   * **Injected from parent frame.**
   * @virtual
   * @type {String}
   */
  attachmentState: undefined,

  /**
   * One of: 'datasets', 'archives', 'files'
   * 
   * **Injected from parent frame.**
   * @virtual
   * @type {String}
   */
  viewMode: 'datasets',

  /**
   * @virtual optional
   * @type {Function}
   */
  containerScrollTop: notImplementedIgnore,

  /**
   * @override
   */
  iframeInjectedProperties: Object.freeze([
    'spaceId',
    'datasetId',
    'archiveId',
    'dirId',
    'selected',
    'attachmentState',
    'viewMode',
  ]),

  getEmptyFetchChildrenResponse() {
    return {
      childrenRecords: [],
      isLast: true,
    };
  },

  _window: window,

  navigateTarget: '_top',

  /**
   * Managed by `switchBrowserModel` observer.
   * @type {Utils.BaseBrowserModel}
   */
  browserModel: undefined,

  /**
   * Default value set on init.
   * @type {Array<EmberObject>} a browsable item that appears on list:
   *  dataset, archive or file
   */
  selectedItems: undefined,

  //#region browser items for various modals

  datasetToCreateArchive: undefined,

  fileToShowInfo: null,

  fileToShowMetadata: null,

  fileToShare: null,

  filesToEditPermissions: null,

  filesToShowDistribution: null,

  filesToShowQos: null,

  fileForConfirmDownload: null,

  archivesToPurge: null,

  //#endregion

  // TODO: VFS-7633 jumping to archive that is not on current list corrupts the list on mock
  // FIXME: support files
  selectedItemsForJumpProxy: promise.object(computed(
    // NOTE: not observing viewMode, because jump should not be performed if viewMode
    // changes
    'selected',
    async function selectedItemsForJumpProxy() {
      const {
        selected,
        viewMode,
      } = this.getProperties('selected', 'viewMode');
      switch (viewMode) {
        case 'archives':
          return this.getArchivesForView(selected);
        case 'datasets':
          return this.getDatasetsForView(selected);
        case 'files':
          return this.getFilesForView(selected);
        default:
          return [];
      }

    }
  )),

  /**
   * Initial value is taken from proxy, see how it 's overwritten in
   * `injectedSelectedChanged` after proxy value change.
   * @type {ComputedProperty<Array<Object>>} array of browsable item
   */
  selectedItemsForJump: reads('selectedItemsForJumpProxy.content'),

  /**
   * NOTE: not observing anything, because it should be one-time proxy
   * @type {PromiseObject<Models.File>}
   */
  initialSelectedItemsForJumpProxy: promise.object(computed(
    function initialSelectedItemsForJumpProxy() {
      return this.get('selectedItemsForJumpProxy');
    }
  )),

  spaceProxy: promise.object(computed('spaceId', function spaceProxy() {
    const {
      spaceManager,
      spaceId,
    } = this.getProperties('spaceManager', 'spaceId');
    return spaceManager.getSpace(spaceId);
  })),

  space: reads('spaceProxy.content'),

  /**
   * @type {ComputedProperty<Object>}
   */
  spacePrivileges: reads('space.privileges'),

  /**
   * NOTE: observing only space, because it should reload initial dir after whole space
   * change.
   * @type {PromiseObject<Models.File>}
   */
  initialBrowsableDatasetProxy: promise.object(computed(
    'spaceProxy',
    'attachmentState',
    async function initialBrowsableDatasetProxy() {
      await this.get('spaceProxy');
      return this.get('browsableDatasetProxy');
    }
  )),

  /**
   * Directory to be viewed on component load - this proxy not recomputes on every dir
   * change.
   * @type {PromiseObject<Models.File>}
   */
  initialDirProxy: promise.object(computed(
    'spaceProxy',
    'initialArchiveProxy',
    async function initialDirProxy() {
      await this.get('spaceProxy');
      await this.get('initialArchiveProxy');
      return this.get('dirProxy');
    }
  )),

  spaceDatasetsRoot: computed(
    'space',
    'attachmentState',
    function spaceDatasetsRoot() {
      const {
        space,
        attachmentState,
      } = this.getProperties('space', 'attachmentState');
      return SpaceDatasetsRootClass.create({
        name: space ? get(space, 'name') : this.t('space'),
        attachmentState,
      });
    }
  ),

  isInRoot: bool('browsableDataset.isDatasetsRoot'),

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

  /**
   * @type {ComputedProperty<PromiseObject<Models.Dataset>>}
   */
  browsableDatasetProxy: promise.object(computed(
    'datasetId',
    'spaceDatasetsRoot',
    'viewMode',
    async function browsableDatasetProxy() {
      const {
        datasetManager,
        globalNotify,
        datasetId,
        spaceDatasetsRoot,
        spaceId,
        viewMode,
      } = this.getProperties(
        'datasetManager',
        'globalNotify',
        'datasetId',
        'spaceDatasetsRoot',
        'spaceId',
        'viewMode',
      );

      if (datasetId) {
        try {
          if (datasetId === spaceDatasetsRootId) {
            return spaceDatasetsRoot;
          }
          const browsableDataset = await datasetManager.getBrowsableDataset(datasetId);
          let isValidDatasetEntityId;
          try {
            isValidDatasetEntityId = datasetId &&
              get(browsableDataset, 'spaceId') === spaceId;
          } catch (error) {
            console.error(
              'component:content-space-datasets#browsableDatasetProxy: error getting spaceId from dataset:',
              error
            );
            isValidDatasetEntityId = false;
          }
          if (!isValidDatasetEntityId) {
            return spaceDatasetsRoot;
          }
          // return only dir-type datasets, for files try to return parent or null
          if (
            viewMode === 'datasets' &&
            get(browsableDataset, 'rootFileType') !== 'dir'
          ) {
            const parent = await get(browsableDataset, 'parent');
            return parent &&
              await datasetManager.getBrowsableDataset(get(parent, 'entityId')) ||
              spaceDatasetsRoot;
          }
          return browsableDataset;
        } catch (error) {
          globalNotify.backendError(this.t('openingDataset'), error);
          return spaceDatasetsRoot;
        }
      } else {
        return spaceDatasetsRoot;
      }
    }
  )),

  /**
   * @type {Models.Dataset}
   */
  browsableDataset: computedLastProxyContent('browsableDatasetProxy'),

  /**
   * Currently viewed directory in archive-file-browser
   * @type {ComputedProperty<Models.File>}
   */
  dirProxy: promise.object(computed(
    'dirId',
    'archiveId',
    async function dirProxy() {
      const {
        dirId,
        archiveId,
      } = this.getProperties('dirId', 'archiveId');
      if (dirId || archiveId) {
        const dir = this.fetchDir(dirId);
        const isValid = await this.isValidFileForContext(dir);
        if (isValid) {
          return dir;
        } else {
          throw new Error('invalid dir specified', dir && get(dir, 'id'));
        }
      } else {
        return null;
      }
    }
  )),

  dir: computedLastProxyContent('dirProxy'),

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
   * @type {PromiseOBject<EmberObject>} resolve with file-like object for
   *  `file-browser#dir` property
   */
  currentBrowsableItemProxy: conditional(
    equal('viewMode', raw('files')),
    'dirProxy',
    'browsableDatasetProxy'
  ),

  currentBrowsableItem: computedLastProxyContent('currentBrowsableItemProxy'),

  /**
   * Proxy for whole file-browser: loading causes loading screen, recomputing causes
   * `file-browser` to be re-rendered.
   * @type {PromiseObject}
   */
  initialRequiredDataProxy: promise.object(computed(
    'spaceProxy',
    'initialBrowsableDatasetProxy',
    'initialSelectedItemsForJumpProxy',
    'initialDirProxy',
    function initialRequiredDataProxy() {
      // viewMode is not observed to prevent unnecessary proxy recompute
      const {
        spaceProxy,
        viewMode,
        initialSelectedItemsForJumpProxy,
      } = this.getProperties(
        'spaceProxy',
        'viewMode',
        'initialSelectedItemsForJumpProxy'
      );
      const proxies = [spaceProxy, initialSelectedItemsForJumpProxy];
      if (viewMode === 'files') {
        const initialDirProxy = this.get('initialDirProxy');
        proxies.push(initialDirProxy);
      } else {
        const initialBrowsableDatasetProxy = this.get('initialBrowsableDatasetProxy');
        proxies.push(initialBrowsableDatasetProxy);
      }
      return allFulfilled(proxies);
    }
  )),

  switchBrowserModel: observer('viewMode', function switchBrowserModel() {
    const {
      viewMode,
      browserModel: currentBrowserModel,
    } = this.getProperties('viewMode', 'browserModel');
    let newBrowserModel;
    switch (viewMode) {
      case 'files':
        newBrowserModel = this.createFilesystemBrowserModel();
        break;
      case 'archives':
        newBrowserModel = this.createArchivesBrowserModel();
        break;
      case 'datasets':
      default:
        newBrowserModel = this.createDatasetsBrowerModel();
    }
    this.set('browserModel', newBrowserModel);
    if (currentBrowserModel) {
      currentBrowserModel.destroy();
    }
  }),

  spaceIdObserver: observer('spaceId', function spaceIdObserver() {
    this.get('containerScrollTop')(0);
  }),

  archiveProxyObserver: observer('archiveProxy', async function archiveProxyObserver() {
    const {
      archiveId,
      archiveProxy,
    } = this.getProperties('archiveId', 'archiveProxy');
    if (archiveId) {
      const archive = await archiveProxy;
      const onezoneArchiveData =
        this.createOnezoneArchiveData(archive);
      this.callParent('updateArchiveData', onezoneArchiveData);
    }
  }),

  clearSelectedObserver: observer(
    'attachmentState',
    'viewMode',
    function clearSelectedObserver() {
      next(() => {
        safeExec(this, () => {
          if (this.get('selectedItems.length') > 0) {
            this.set('selectedItems', []);
          }
        });
      });
    }
  ),

  updateOnezoneDatasetData: observer(
    'browsableDatasetProxy',
    async function updateOnezoneDatasetData() {
      const browsableDataset = await this.get('browsableDatasetProxy');
      if (browsableDataset) {
        const data = this.createOnezoneDatasetData(browsableDataset);
        this.callParent('updateDatasetData', data);
      }
    }
  ),

  /**
   * Observer: override selected items when value injected from outside changes
   */
  injectedSelectedChanged: observer(
    'selectedItemsForJumpProxy.content',
    function injectedSelectedChanged() {
      // TODO: VFS-7633 currently only selecting archives from URL is supported
      if (this.get('viewMode') !== 'archives') {
        return;
      }
      const selectedItemsForJump = this.get('selectedItemsForJumpProxy.content');
      if (selectedItemsForJump) {
        this.set('selectedItemsForJump', selectedItemsForJump);
      }
    }),

  init() {
    this._super(...arguments);
    this.switchBrowserModel();
    if (!this.get('selectedItems')) {
      this.set('selectedItems', []);
    }
    this.updateOnezoneDatasetData();
    this.archiveProxyObserver();
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

  async getDatasetsForView(ids) {
    if (!ids) {
      return [];
    }

    const {
      datasetManager,
      spaceId,
    } = this.getProperties('datasetManager', 'spaceId');
    if (ids) {
      const datasets =
        await onlyFulfilledValues(ids.map(id =>
          datasetManager.getBrowsableDataset(id)
        ));
      try {
        // allow only dataset which belong to current space
        return datasets.filter(dataset => get(dataset, 'spaceId') === spaceId);
      } catch (error) {
        return [];
      }
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
    if (ids) {
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
    }
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

  async fetchDir(fileId) {
    return this.getFileById(fileId);
  },

  createOnezoneDatasetData(dataset) {
    const data = getProperties(
      dataset,
      'entityId',
      'name',
      'state',
      'spaceId',
      'protectionFlags',
      'effProtectionFlags',
      'creationTime',
      'archiveCount',
      'rootFilePath',
      'rootFileType',
    );
    data.parentId = dataset.relationEntityId('parent') || null;
    data.rootFileId = dataset.relationEntityId('rootFile') || null;
    return data;
  },

  /**
   * Create object with archive information to use in Onezone.
   * @param {Utils.BrowsableArchive} archive
   * @returns {Object}
   */
  createOnezoneArchiveData(archive) {
    // NOTE: stats and state are not passed to Onezone, because archive data is not
    // observed for change to be passed to Onezone
    const data = getProperties(
      archive,
      'entityId',
      'name',
      'creationTime',
      'description',
      'preservedCallback',
      'purgedCallback',
    );
    data.config = Object.assign({}, get(archive, 'config'));
    [
      'baseArchive',
      'relatedDip',
      'relatedAip',
      'dataset',
      'rootDir',
    ].forEach(relationName => {
      data[`${relationName}Id`] = archive.relationEntityId(relationName) || null;
    });
    return data;
  },

  /**
   * @param {Object} options
   * @returns {String} Onezone URL for directory in file browser
   */
  getDataUrl(options) {
    return this.callParent('getDataUrl', options);
  },

  /**
   * @param {Object} options
   * @returns {String} Onezone URL for directory in dataset browser
   */
  getDatasetsUrl(options) {
    return this.callParent('getDatasetsUrl', options);
  },

  getShareUrl(options) {
    return this.callParent('getShareUrl', options);
  },

  getTransfersUrl(options) {
    return this.callParent('getTransfersUrl', options);
  },

  createDatasetsBrowerModel() {
    return DatasetBrowserModel.create({
      ownerSource: this,
      spaceDatasetsViewState: this,
      getDataUrl: this.getDataUrl.bind(this),
      getDatasetsUrl: this.getDatasetsUrl.bind(this),
      openDatasetsModal: this.openDatasetsModal.bind(this),
      openCreateArchiveModal: this.openCreateArchiveModal.bind(this),
      openDatasetOpenModal: this.openDatasetOpenModal.bind(this),
      openArchivesView: this.openArchivesView.bind(this),
    });
  },

  createArchivesBrowserModel() {
    return ArchiveBrowserModel.create({
      ownerSource: this,
      spaceDatasetsViewState: this,
      getDatasetsUrl: this.getDatasetsUrl.bind(this),
      openCreateArchiveModal: this.openCreateArchiveModal.bind(this),
      openPurgeModal: this.openArchivesPurgeModal.bind(this),
    });
  },

  createFilesystemBrowserModel() {
    return ArchiveFilesystemBrowserModel.create({
      ownerSource: this,
      // TODO: VFS-7406 use dir or file-dataset icons
      rootIcon: 'browser-dataset',
      downloadScope: 'private',
      openInfo: this.openInfoModal.bind(this),
      openMetadata: this.openMetadataModal.bind(this),
      openShare: this.openShareModal.bind(this),
      openEditPermissions: this.openEditPermissionsModal.bind(this),
      openFileDistribution: this.openFileDistributionModal.bind(this),
      openQos: this.openQosModal.bind(this),
      openConfirmDownload: this.openConfirmDownload.bind(this),
    });
  },

  // TODO: VFS-7406 to implement check if file is from current space and archive
  async isValidFileForContext( /* file */ ) {
    return true;
  },

  async fetchSpaceDatasets(rootId, startIndex, size, offset /**, array */ ) {
    if (rootId !== spaceDatasetsRootId) {
      throw new Error(
        'component:content-space-datasets#fetchRootChildren: cannot use fetchRootChildren for non-root'
      );
    }
    const {
      datasetManager,
      spaceId,
      attachmentState,
    } = this.getProperties(
      'datasetManager',
      'spaceId',
      'attachmentState'
    );
    if (size <= 0) {
      return this.getEmptyFetchChildrenResponse();
    } else {
      return this.browserizeDatasets(await datasetManager.fetchChildrenDatasets({
        parentType: 'space',
        parentId: spaceId,
        state: attachmentState,
        index: startIndex,
        limit: size,
        offset,
      }));
    }
  },

  async fetchDatasetChildren(datasetId, startIndex, size, offset) {
    const {
      datasetManager,
      attachmentState,
    } = this.getProperties(
      'datasetManager',
      'attachmentState',
    );
    return this.browserizeDatasets(await datasetManager.fetchChildrenDatasets({
      parentType: 'dataset',
      parentId: datasetId,
      state: attachmentState,
      index: startIndex,
      limit: size,
      offset,
    }));
  },

  async fetchDatasetArchives(datasetId, startIndex, size, offset) {
    const archiveManager = this.get('archiveManager');
    return this.browserizeArchives(await archiveManager.fetchDatasetArchives({
      datasetId,
      index: startIndex,
      limit: size,
      offset,
    }));
  },

  async fetchDirChildren(dirId, startIndex, size, offset) {
    const fileManager = this.get('fileManager');
    return fileManager
      .fetchDirChildren(dirId, 'private', startIndex, size, offset);
  },

  async browserizeDatasets({ childrenRecords, isLast }) {
    const datasetManager = this.get('datasetManager');
    return {
      childrenRecords: await allFulfilled(childrenRecords.map(r =>
        datasetManager.getBrowsableDataset(get(r, 'entityId'))
      )),
      isLast,
    };
  },

  async browserizeArchives({ childrenRecords, isLast }) {
    const archiveManager = this.get('archiveManager');
    return {
      childrenRecords: await allFulfilled(childrenRecords.map(record =>
        archiveManager.getBrowsableArchive(get(record, 'entityId'))
      )),
      isLast,
    };
  },

  /**
   * @param {Models.File} file root file of selected dataset
   */
  openDatasetsModal(file) {
    this.set('filesToShowDatasets', [file]);
  },

  closeDatasetsModal() {
    this.set('filesToShowDatasets', null);
  },

  openDatasetOpenModal(dataset) {
    this.set('fileToShowDatasetOpen', dataset);
  },

  closeDatasetOpenModal() {
    this.set('fileToShowDatasetOpen', null);
  },

  /**
   * @param {Models.Dataset} dataset dataset for which create archive form will be shown
   */
  openCreateArchiveModal(dataset) {
    this.set('datasetToCreateArchive', dataset);
  },

  closeCreateArchiveModal() {
    this.set('datasetToCreateArchive', null);
  },

  async submitArchiveCreate(dataset, archiveData) {
    const {
      _window,
      archiveManager,
      navigateTarget,
    } = this.getProperties('_window', 'archiveManager', 'navigateTarget');
    const archive = await archiveManager.createArchive(dataset, archiveData);
    try {
      // FIXME: try to use changeSelectedItems
      const archiveSelectUrl = this.getDatasetsUrl({
        viewMode: 'archives',
        datasetId: get(dataset, 'entityId'),
        archive: null,
        selected: get(archive, 'entityId'),
        dir: null,
      });
      if (archiveSelectUrl) {
        _window.open(archiveSelectUrl, navigateTarget);
      }
    } catch (error) {
      console.error(
        `component:content-space-dataset#submitArchiveCreate: selecting newly created archive failed: ${error}`
      );
    }
    return archive;
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

  openArchivesView(dataset) {
    this.callParent('updateViewMode', 'archives');
    this.callParent('updateDatasetId', get(dataset, 'entityId'));
    this.callParent('updateDatasetData', this.createOnezoneDatasetData(dataset));
  },

  openInfoModal(file) {
    this.set('fileToShowInfo', file);
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

  actions: {
    /**
     * @param {String} itemId datasetId, archiveVirtualRootDirId or fileId (dir)
     */
    async updateDirEntityId(itemId) {
      const viewMode = this.get('viewMode');
      if (viewMode === 'datasets') {
        this.callParent('updateDatasetId', itemId);
      } else if (viewMode === 'archives') {
        this.callParent('updateViewMode', 'files');
        this.callParent('updateArchiveId', itemId);
        this.callParent('updateDirId', null);
      } else if (viewMode === 'files') {
        if (itemId === this.get('datasetId')) {
          this.callParent('updateArchiveId', null);
          this.callParent('updateDirId', null);
          this.callParent('updateViewMode', 'archives');
        } else {
          this.callParent('updateDirId', itemId);
        }
      }
    },
    changeSelectedItems(selectedItems) {
      this.set('selectedItems', selectedItems);
    },
    containerScrollTop() {
      return this.get('containerScrollTop')(...arguments);
    },
    async resolveItemParent(item) {
      const viewMode = this.get('viewMode');
      if (!item) {
        return null;
      }
      const itemEntityId = get(item, 'entityId');
      if (viewMode === 'files') {
        const browsableType = get(item, 'browsableType');
        // if browsable item has no type, it defaults to file (first and original
        // browsable object)
        if (!browsableType || browsableType === 'file') {
          const archive = this.get('archive') || await this.get('archiveProxy');
          const archiveRootDirId = archive && archive.relationEntityId('rootDir');
          if (itemEntityId === archiveRootDirId) {
            // file browser: archive root dir, parent: dataset
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
                window.top.location = url;
                window.location.reload();
                return null;
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
        } else if (browsableType === 'dataset') {
          // file browser: dataset on path
          return null;
        }
      } else if (viewMode === 'archives') {
        // archive browser: root (there is no archives tree - only flat list starting
        // from root)
        return null;
      } else if (itemEntityId === spaceDatasetsRootId) {
        // dataset browser: space root
        return null;
      } else if (!get(item, 'hasParent')) {
        // dataset browser: tree top
        return this.get('spaceDatasetsRoot');
      } else {
        // dataset browser: regular dataset
        return get(item, 'parent');
      }
    },
    async fetchChildren(...fetchArgs) {
      const {
        isInRoot,
        viewMode,
        datasetId,
        currentBrowsableItemProxy,
      } = this.getProperties(
        'isInRoot',
        'viewMode',
        'datasetId',
        'currentBrowsableItemProxy',
      );
      // a workaround for fb-table trying to get children when it have not-updated "dir"
      if (!get(currentBrowsableItemProxy, 'isSettled')) {
        return this.getEmptyFetchChildrenResponse();
      }

      if (viewMode === 'files') {
        const entityId = fetchArgs[0];
        if (entityId === datasetId) {
          // a workaround for fb-table trying to get children when it have not-updated "dir"
          return this.getEmptyFetchChildrenResponse();
        } else {
          return this.fetchDirChildren(...fetchArgs);
        }
      } else if (viewMode === 'archives' && datasetId) {
        return this.fetchDatasetArchives(...fetchArgs);
      } else if (isInRoot) {
        return this.fetchSpaceDatasets(...fetchArgs);
      } else {
        return this.fetchDatasetChildren(...fetchArgs);
      }
    },
  },
});
