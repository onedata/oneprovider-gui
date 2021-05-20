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
import EmberObject, { computed, get, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import ContentSpaceBaseMixin from 'oneprovider-gui/mixins/content-space-base';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { promise, raw, bool } from 'ember-awesome-macros';
import { resolve } from 'rsvp';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import BrowsableDataset from 'oneprovider-gui/utils/browsable-dataset';
import BrowsableArchive from 'oneprovider-gui/utils/browsable-archive';
import DatasetBrowserModel from 'oneprovider-gui/utils/dataset-browser-model';
import ArchiveBrowserModel from 'oneprovider-gui/utils/archive-browser-model';
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
   * @type {Array<String>}
   */
  selectedIds: undefined,

  /**
   * One of: 'attached', 'detached'
   * 
   * **Injected from parent frame.**
   * @virtual
   * @type {String}
   */
  attachmentState: undefined,

  /**
   * One of: 'datasets', 'archives'
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
    'selectedIds',
    'attachmentState',
    'viewMode',
  ]),

  _window: window,

  /**
   * Default value set on init.
   * @type {Array<Utils.BrowsableDataset>}
   */
  selectedItems: undefined,

  datasetToCreateArchive: undefined,

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
    function initialBrowsableDatasetProxy() {
      return this.get('browsableDatasetProxy');
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
   * @type {ComputedProperty<PromiseObject<Models.Dataset>>}
   */
  browsableDatasetProxy: promise.object(computed(
    'datasetId',
    'spaceDatasetsRoot',
    'viewMode',
    async function datasetProxy() {
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

  initialRequiredDataProxy: promise.object(promise.all(
    'spaceProxy',
    'initialBrowsableDatasetProxy'
  )),

  browserModel: computed('viewMode', function browserModel() {
    if (this.get('viewMode') === 'archives') {
      return this.createArchivesBrowserModel();
    } else {
      return this.createDatasetsBrowerModel();
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
        this.callParent('updateDatasetData', browsableDataset);
      }
    }
  ),

  init() {
    this._super(...arguments);
    if (!this.get('selectedItems')) {
      this.set('selectedItems', []);
    }
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
    });
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

  async fetchDatsetArchives(datasetId, startIndex, size, offset) {
    const archiveManager = this.get('archiveManager');
    return this.browserizeArchives(await archiveManager.fetchDatasetArchives({
      datasetId,
      index: startIndex,
      limit: size,
      offset,
    }));
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
    this.callParent('updateDatasetData', dataset);
  },

  actions: {
    /**
     * @param {String} itemId currently: datasetId
     */
    updateDirEntityId(itemId) {
      // TODO: VFS-7648 change mode and dirId when entering archive
      if (this.get('viewMode') !== 'archives') {
        this.callParent('updateDatasetId', itemId);
      }
    },
    changeSelectedItems(selectedItems) {
      this.set('selectedItems', selectedItems);
    },
    containerScrollTop() {
      return this.get('containerScrollTop')(...arguments);
    },
    async resolveFileParent(dataset) {
      const viewMode = this.get('viewMode');
      if (viewMode === 'archives') {
        // archive browser: root (there is no archives tree - only flat list starting
        // from root)
        return null;
      } else if (get(dataset, 'entityId') === spaceDatasetsRootId) {
        // dataset browser: space root
        return null;
      } else if (!get(dataset, 'hasParent')) {
        // dataset browser: tree top
        return this.get('spaceDatasetsRoot');
      } else {
        // dataset browser: regular dataset
        return get(dataset, 'parent');
      }
    },
    fetchChildren(...fetchArgs) {
      const {
        isInRoot,
        viewMode,
        datasetId,
      } = this.getProperties('isInRoot', 'viewMode', 'datasetId');
      if (viewMode === 'archives' && datasetId) {
        return this.fetchDatsetArchives(...fetchArgs);
      } else if (isInRoot) {
        return this.fetchSpaceDatasets(...fetchArgs);
      } else {
        return this.fetchDatasetChildren(...fetchArgs);
      }
    },
  },
});
