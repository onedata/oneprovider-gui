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
import BrowsableArchive from 'oneprovider-gui/utils/browsable-archive';
import DatasetBrowserModel from 'oneprovider-gui/utils/dataset-browser-model';
import ArchiveBrowserModel from 'oneprovider-gui/utils/archive-browser-model';
import ArchiveFilesystemBrowserModel from 'oneprovider-gui/utils/archive-filesystem-browser-model';
import { next } from '@ember/runloop';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';

const spaceDatasetsRootId = 'spaceDatasetsRoot';

const SpaceDatasetsRootBaseClass = EmberObject.extend({
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

const SpaceDatasetsRootClass = BrowsableDataset.extend({
  content: SpaceDatasetsRootBaseClass.create(),
});

const archiveVirtualRootDirId = 'archiveVirtualRoot';

const ArchiveVirtualRootDirClass = EmberObject.extend({
  id: archiveVirtualRootDirId,
  entityId: archiveVirtualRootDirId,
  type: 'dir',
  isArchiveVirtualRootDir: true,
  hasParent: false,
  parent: promise.object(raw(resolve(null))),

  relationEntityId( /*relation*/ ) {
    return null;
  },
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

  initialArchiveVirtualRootDirProxy: promise.object(computed(
    'spaceProxy',
    'initialDatasetProxy',
    async function initialArchiveProxy() {
      await this.get('spaceProxy');
      await this.get('initialDatasetProxy');
      return this.get('archiveVirtualRootDirProxy');
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

  /**
   * Fake directory, that has one child: archive root dir
   * @type {PromiseObject<EmberObject>}
   */
  archiveVirtualRootDirProxy: promise.object(computed(
    'archiveProxy',
    async function archiveVirtualRootDirProxy() {
      const archive = await this.get('archiveProxy');
      return ArchiveVirtualRootDirClass.create({
        name: archive && get(archive, 'name') || '',
      });
    }
  )),

  archiveVirtualRootDir: reads('archiveVirtualRootDirProxy.content'),

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
        return BrowsableArchive.create({
          content: await archiveManager.getArchive(archiveId),
        });
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
          const dataset = await datasetManager.getDataset(datasetId);
          let isValidDatasetEntityId;
          try {
            isValidDatasetEntityId = datasetId &&
              get(dataset, 'spaceId') === spaceId;
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
          if (viewMode === 'datasets' && get(dataset, 'rootFileType') !== 'dir') {
            const parent = await get(dataset, 'parent');
            return parent && BrowsableDataset.create({ content: parent }) ||
              spaceDatasetsRoot;
          }
          return BrowsableDataset.create({ content: dataset });
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
    async function dirProxy() {
      const {
        fileManager,
        dirId,
      } = this.getProperties('fileManager', 'dirId');
      if (dirId) {
        const file = await fileManager.getFileById(dirId, 'private');
        const isValid = await this.isValidFileForContext(file);
        if (isValid) {
          return file;
        } else {
          throw new Error('invalid dir specified');
        }
      } else {
        return null;
      }
    }
  )),

  dir: computedLastProxyContent('dirProxy'),

  /**
   * @type {PromiseOBject<EmberObject>} resolve with file-like object for
   *  `file-browser#dir` property
   */
  currentBrowsableItemProxy: conditional(
    equal('viewMode', raw('files')),
    conditional(
      'dirId',
      'dirProxy',
      'archiveVirtualRootDirProxy'
    ),
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
    'initialDirProxy',
    'initialArchiveVirtualRootDirProxy',
    function initialRequiredDataProxy() {
      // viewMode is not observed to prevent unnecessary proxy recompute
      const {
        spaceProxy,
        viewMode,
      } = this.get('spaceProxy', 'viewMode');
      if (viewMode === 'files') {
        if (this.get('dirId')) {
          const initialDirProxy = this.get('initialDirProxy');
          return allFulfilled([spaceProxy, initialDirProxy]);
        } else {
          const initialArchiveVirtualRootDirProxy =
            this.get('initialArchiveVirtualRootDirProxy');
          return allFulfilled([spaceProxy, initialArchiveVirtualRootDirProxy]);
        }
      } else {
        const initialBrowsableDatasetProxy = this.get('initialBrowsableDatasetProxy');
        return allFulfilled([spaceProxy, initialBrowsableDatasetProxy]);
      }
    }
  )),

  customRootDir: computed(
    'viewMode',
    'spaceDatasetsRoot',
    'archive',
    function customRootDir() {
      if (this.get('viewMode') === 'files') {
        return this.get('archive');
      } else {
        return this.get('spaceDatasetsRoot');
      }
    }
  ),

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

  init() {
    this._super(...arguments);
    this.switchBrowserModel();
    if (!this.get('selectedItems')) {
      this.set('selectedItems', []);
    }
    this.updateOnezoneDatasetData();
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

  async fetchSpaceDatasets(rootId, startIndex, size, offset, array) {
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
    if (startIndex == null) {
      if (size <= 0 || offset < 0) {
        return this.getEmptyFetchChildrenResponse();
      } else {
        return this.browserizeDatasets(await datasetManager.fetchChildrenDatasets({
          parentType: 'space',
          parentId: spaceId,
          state: attachmentState,
          limit: size,
          offset,
        }));
      }
    } else if (startIndex === array.get('sourceArray.lastObject.index')) {
      return this.getEmptyFetchChildrenResponse();
    } else {
      throw new Error(
        'component:content-space-datasets#fetchRootChildren: illegal fetch arguments for virtual root dir'
      );
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

  browserizeDatasets({ childrenRecords, isLast }) {
    return {
      childrenRecords: childrenRecords.map(r => BrowsableDataset.create({ content: r })),
      isLast,
    };
  },

  browserizeArchives({ childrenRecords, isLast }) {
    return {
      childrenRecords: childrenRecords.map(r => BrowsableArchive.create({ content: r })),
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

  submitArchiveCreate(dataset, archiveData) {
    return this.get('archiveManager').createArchive(dataset, archiveData);
  },

  /**
   * @param {Array<Models.Archive>} archives
   */
  openArchivesPurgeModal(archives) {
    console.log('open purge');
    this.set('archivesToPurge', archives);
  },

  closeArchivesPurgeModal() {
    console.log('close purge');
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

  async fetchArchiveVirtualChildren(entityId, startIndex, size, offset, array) {
    if (
      (!entityId || entityId === archiveVirtualRootDirId) &&
      startIndex == null &&
      size > 0 &&
      offset === 0
    ) {
      const rootFile = await this.get('archive.rootFile');
      return { childrenRecords: [rootFile], isLast: true };
    } else {
      if (
        (!entityId || entityId === archiveVirtualRootDirId) &&
        (startIndex == null && (size <= 0 || offset < 0)) ||
        startIndex === array.get('sourceArray.lastObject.index')
      ) {
        return { childrenRecords: [], isLast: true };
      } else {
        throw new Error(
          'component:content-space-datasets#fetchArchiveVirtualChildren: illegal fetch children for virtual share root dir'
        );
      }
    }
  },

  actions: {
    /**
     * @param {String} itemId datasetId, archiveVirtualRootDirId or fileId (dir)
     */
    updateDirEntityId(itemId) {
      const viewMode = this.get('viewMode');
      if (viewMode === 'datasets') {
        this.callParent('updateDatasetId', itemId);
      } else if (viewMode === 'archives') {
        this.callParent('updateViewMode', 'files');
        this.callParent('updateArchiveId', itemId);
        this.callParent('updateDirId', null);
      } else if (viewMode === 'files') {
        if (itemId === archiveVirtualRootDirId) {
          this.callParent('updateDirId', null);
        } else if (itemId === this.get('datasetId')) {
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
    async resolveFileParent(item) {
      const viewMode = this.get('viewMode');
      if (!item) {
        return null;
      }
      const itemEntityId = get(item, 'entityId');
      if (viewMode === 'files') {
        const browsableType = get(item, 'browsableType');
        // if browsable item has no type, it defaults to file (first and original
        // browsable object)
        if (!browsableType) {
          const archive = this.get('archive') || await this.get('archiveProxy');
          const archiveRootFileId = archive && archive.relationEntityId('rootFile');
          if (itemEntityId === archiveVirtualRootDirId) {
            // file browser: virtual archive root, parent: dataset
            return this.get('browsableDatasetProxy');
          } else if (itemEntityId === archiveRootFileId) {
            // file browser: archive root file, parent: virtual archive root
            return this.get('archiveVirtualRootDirProxy');
          } else if (get(item, 'hasParent')) {
            // file browser: it's a subdir
            return get(item, 'parent');
          } else {
            // file browser: it's rather some problem with getting dir parent,
            // so resolve virtual root
            return this.get('archiveVirtualRootDirProxy');
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
        } else if (!entityId || entityId === archiveVirtualRootDirId) {
          return this.fetchArchiveVirtualChildren(...fetchArgs);
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
