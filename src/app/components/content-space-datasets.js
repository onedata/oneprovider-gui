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
import FilesystemBrowserModel from 'oneprovider-gui/utils/filesystem-browser-model';
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
});

const archiveVirtualRootDirId = 'archiveRoot';

const ArchiveVirtualRootDirClass = EmberObject.extend({
  id: archiveVirtualRootDirId,
  entityId: archiveVirtualRootDirId,
  type: 'dir',
  isArchiveVirtualRootDir: true,
  hasParent: false,
  parent: promise.object(raw(resolve(null))),
});

const SpaceDatasetsRootClass = BrowsableDataset.extend({
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

  datasetToCreateArchive: undefined,

  fileToShowInfo: null,

  fileToShowMetadata: null,

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

  initialArchiveProxy: promise.object(computed(
    'spaceProxy',
    'initialDatasetProxy',
    async function initialArchiveProxy() {
      await this.get('spaceProxy');
      await this.get('initialDatasetProxy');
      return this.get('archiveProxy');
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
        name: get(archive, 'name'),
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
      return BrowsableArchive.create({
        content: await archiveManager.getArchive(archiveId),
      });
    }
  )),

  archive: computedLastProxyContent('archiveProxy'),

  archiveRootDirId: computed('archive', function archiveRootDirId() {
    const archive = this.get('archive');
    if (archive) {
      return archive.relationEntityId('rootDir');
    }
  }),

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
      'archiveProxy'
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
    'initialArchiveProxy',
    function initialRequiredDataProxy() {
      // viewMode is not observed to prevent unnecessary proxy recompute
      const viewMode = this.get('viewMode');
      if (viewMode === 'files') {
        if (this.get('dirId')) {
          const {
            spaceProxy,
            initialDirProxy,
          } = this.getProperties('spaceProxy', 'initialDirProxy');
          return allFulfilled([spaceProxy, initialDirProxy]);
        } else {
          const {
            spaceProxy,
            initialArchiveProxy,
          } = this.getProperties('spaceProxy', 'initialArchiveProxy');
          return allFulfilled([spaceProxy, initialArchiveProxy]);
        }
      } else {
        const {
          spaceProxy,
          initialBrowsableDatasetProxy,
        } = this.getProperties('spaceProxy', 'initialBrowsableDatasetProxy');
        return allFulfilled([spaceProxy, initialBrowsableDatasetProxy]);
      }
    }
  )),

  previewMode: equal('viewMode', raw('files')),

  customRootDir: computed(
    'viewMode',
    'spaceDatasetsRoot',
    'archive',
    function customRootDir() {
      if (this.get('viewMode') === 'files') {
        console.log('using root archive');
        return this.get('archive');
      } else {
        console.log('using root dataset');
        return this.get('spaceDatasetsRoot');
      }
    }
  ),

  switchBrowserModel: observer('viewMode', function switchBrowserModel() {
    const {
      viewMode,
      browserModel: currentBrowserModel,
    } = this.getProperties('viewMode', 'browserModel');
    let browserModel;
    switch (viewMode) {
      case 'files':
        browserModel = this.createFilesystemBrowserModel();
        break;
      case 'archives':
        browserModel = this.createArchivesBrowserModel();
        break;
      case 'datasets':
      default:
        browserModel = this.createDatasetsBrowerModel();
    }
    this.set('browserModel', browserModel);
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
      browserModel.destroy();
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
    });
  },

  createFilesystemBrowserModel() {
    return FilesystemBrowserModel.create({
      ownerSource: this,
      // TODO: VFS-7406 use dir or file-dataset icons
      rootIcon: 'browser-dataset',
      downloadScope: 'private',
      openInfo: this.openInfoModal.bind(this),
      openMetadata: this.openMetadataModal.bind(this),
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
        return resolve({ childrenRecords: [], isLast: true });
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
      return resolve({ childrenRecords: [], isLast: true });
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

  async fetchArchiveVirtualRootDirChildren(dirId, startIndex, size, offset, array) {
    if (dirId !== archiveVirtualRootDirId && dirId) {
      throw new Error(
        'component:content-space-datasets#fetchArchiveVirtualRootDirChildren: cannot use for non-share-root'
      );
    }
    if (startIndex == null) {
      if (size <= 0 || offset < 0) {
        return { childrenRecords: [], isLast: true };
      } else {
        const rootDir = await this.get('archive.rootDir');
        return { childrenRecords: [rootDir], isLast: true };
      }
    } else if (startIndex === array.get('sourceArray.lastObject.index')) {
      return { childrenRecords: [], isLast: true };
    } else {
      throw new Error(
        'component:content-space-datasets#fetchArchiveVirtualRootDirChildren: illegal fetch children for virtual share root dir'
      );
    }
  },

  actions: {
    /**
     * @param {String} itemId datasetId, archiveId or fileId (dir)
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
        if (itemId === this.get('archiveId')) {
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
      console.log('resolve parent', get(item, 'name'));
      const viewMode = this.get('viewMode');
      if (viewMode === 'files') {
        const browsableType = get(item, 'browsableType');
        // if browsable item has no type, it defaults to file (first and original
        // browsable object)
        if (!browsableType) {
          // const archive = await this.get('archiveProxy');
          // const archiveRootDirId = archive.relationEntityId('rootDir');
          const archiveRootDirId = this.get('archiveRootDirId');
          const dirParentId = item.relationEntityId('parent');
          console.log('dir', get(item, 'name'), dirParentId === archiveRootDirId, archiveRootDirId, dirParentId);
          if (dirParentId === archiveRootDirId || !get(item, 'hasParent')) {
            // file browser: it's an archive root first child
            return this.get('archiveProxy');
          } else if (get(item, 'hasParent')) {
            // file browser: it's a subdir
            return get(item, 'parent');
          } else {
            // file browser: it's rather some problem with getting dir parent,
            // so resolve virtual root
            return this.get('archiveProxy');
          }
        } else if (browsableType === 'archive') {
          // file browser: archive on path, the dataset is a parent
          return this.get('browsableDatasetProxy');
        } else if (browsableType === 'dataset') {
          // file browser: dataset on path
          return null;
        }
      } else if (viewMode === 'archives') {
        // archive browser: root (there is no archives tree - only flat list starting
        // from root)
        return null;
      } else if (get(item, 'entityId') === spaceDatasetsRootId) {
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
        dirId,
        archive,
      } = this.getProperties(
        'isInRoot',
        'viewMode',
        'datasetId',
        'dirId',
        'archive',
      );
      if (viewMode === 'files') {
        const parentId = dirId || archive.relationEntityId('rootDir');
        return this.fetchDirChildren(parentId, ...fetchArgs.slice(1));
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
