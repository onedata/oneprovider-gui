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
import { promise, raw, bool, conditional, equal, and, notEqual } from 'ember-awesome-macros';
import { resolve, all as allFulfilled } from 'rsvp';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import BrowsableDataset from 'oneprovider-gui/utils/browsable-dataset';
import DatasetBrowserModel from 'oneprovider-gui/utils/dataset-browser-model';
import onlyFulfilledValues from 'onedata-gui-common/utils/only-fulfilled-values';
import ItemBrowserContainerBase from 'oneprovider-gui/mixins/item-browser-container-base';
import { isEmpty } from '@ember/utils';
import SplitGrid from 'npm:split-grid';
import _ from 'lodash';
import sleep from 'onedata-gui-common/utils/sleep';
import { throttleTimeout } from 'onedata-gui-common/services/app-proxy';

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
  async reload() {
    return this;
  },
});

export const SpaceDatasetsRootClass = BrowsableDataset.extend({
  content: SpaceDatasetsRootBaseClass.create(),
});

const mixins = [
  I18n,
  ContentSpaceBaseMixin,
  ItemBrowserContainerBase,
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
  parentAppNavigation: service(),

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
   * IDs of selected datasets injected for jump.
   * Single selected dataset means that its archives browser will be rendered.
   * @virtual optional
   * @type {Array<String>}
   */
  selectedDatasets: undefined,

  /**
   * **Injected from parent frame.**
   * IDs of selected archives injected for jump (for secondary browser).
   * @virtual optional
   * @type {Array<String>}
   */
  selectedArchives: undefined,

  /**
   * **Injected from parent frame.**
   * IDs of selected files injected for jump (for secondary browser, if archive filesystem
   * is browsed).
   * @virtual optional
   * @type {Array<String>}
   */
  selectedFiles: undefined,

  /**
   * One of: 'attached', 'detached'
   *
   * **Injected from parent frame.**
   * @virtual
   * @type {String}
   */
  attachmentState: undefined,

  /**
   * @virtual optional
   * @type {Function}
   */
  containerScrollTop: notImplementedIgnore,

  /**
   * Reference to browser API registered by internal component (if available).
   * @type {FbTableApi}
   */
  datasetBrowserApi: undefined,

  /**
   * Reference to browser API registered by internal component (if available).
   * @type {FbTableApi}
   */
  archiveBrowserApi: undefined,

  /**
   * @override
   */
  iframeInjectedProperties: Object.freeze([
    'spaceId',
    'datasetId',
    'archiveId',
    'dirId',
    'selectedDatasets',
    'selectedArchives',
    'selectedFiles',
    'attachmentState',
  ]),

  /**
   * Initialized on `didInsertElement`.
   * @type {Split} see `split-grid` NPM package
   */
  splitGrid: undefined,

  _window: window,

  /**
   * Ignore deselect selector for dataset browser.
   * See `component:file-browser#ignoreDeselectSelector` purpose.
   * @type {String}
   */
  ignoreDatasetDeselectSelector: '#content-scroll, .archive-browser-container, .archive-browser-container *, .dataset-browser-container .ps__rail-y, .dataset-browser-container .ps__rail-y *',

  /**
   * Ignore deselect selector for archive browser.
   * See `component:file-browser#ignoreDeselectSelector` purpose.
   * @type {String}
   */
  ignoreArchiveDeselectSelector: '#content-scroll, .dataset-browser-container, .dataset-browser-container *, .archive-browser-container .ps__rail-y, .archive-browser-container .ps__rail-y *',

  /**
   * Set on init.
   * @type {Utils.DatasetBrowserModel}
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

  /**
   * Injected options for archive creation.
   * @type {CreateArchiveOptions}
   */
  createArchiveOptions: undefined,

  fileToShowInfo: null,

  showInfoInitialTab: undefined,

  fileToShowMetadata: null,

  fileToShare: null,

  datasetToShowProtection: null,

  fileToShowProtection: null,

  filesToEditPermissions: null,

  filesToShowDistribution: null,

  filesToShowQos: null,

  fileForConfirmDownload: null,

  archivesToPurge: null,

  //#endregion

  /**
   * @override
   */
  selectedItemsForJumpProxy: promise.object(computed(
    'spaceId',
    'datasetId',
    'selectedDatasets',
    async function selectedItemsForJumpProxy() {
      const selectedDatasets = this.get('selectedDatasets');
      return this.getDatasetsForView(selectedDatasets);
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

  archive: computedLastProxyContent('archiveProxy'),

  currentBrowsableItemProxy: reads('browsableDatasetProxy'),

  /**
   * @type {ComputedProperty<PromiseObject<Models.Dataset>>}
   */
  browsableDatasetProxy: promise.object(computed(
    'datasetId',
    'spaceDatasetsRoot',
    async function browsableDatasetProxy() {
      const {
        datasetManager,
        globalNotify,
        datasetId,
        spaceDatasetsRoot,
        spaceId,
        // NOTE: selected is not observed because change of selected should not cause
        // dir change
        selectedDatasets,
      } = this.getProperties(
        'datasetManager',
        'globalNotify',
        'datasetId',
        'spaceDatasetsRoot',
        'spaceId',
        'selectedDatasets',
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
          if (get(browsableDataset, 'rootFileType') !== 'dir') {
            const parent = await get(browsableDataset, 'parent');
            return parent &&
              await datasetManager.getBrowsableDataset(parent) ||
              spaceDatasetsRoot;
          }
          return browsableDataset;
        } catch (error) {
          globalNotify.backendError(this.t('openingDataset'), error);
          return spaceDatasetsRoot;
        }
      } else {
        return this.resolveDatasetForSelectedIds(selectedDatasets);
      }
    }
  )),

  /**
   * @type {Models.Dataset}
   */
  browsableDataset: computedLastProxyContent('browsableDatasetProxy'),

  /**
   * Proxy for whole file-browser: loading causes loading screen, recomputing causes
   * `file-browser` to be re-rendered.
   * @type {PromiseObject}
   */
  initialRequiredDataProxy: promise.object(computed(
    'spaceProxy',
    'initialBrowsableDatasetProxy',
    'initialSelectedItemsForJumpProxy',
    function initialRequiredDataProxy() {
      const {
        spaceProxy,
        initialSelectedItemsForJumpProxy,
        initialBrowsableDatasetProxy,
      } = this.getProperties(
        'spaceProxy',
        'initialSelectedItemsForJumpProxy',
        'initialBrowsableDatasetProxy',
      );
      const proxies = [
        spaceProxy,
        initialSelectedItemsForJumpProxy,
        initialBrowsableDatasetProxy,
      ];
      return allFulfilled(proxies);
    }
  )),

  gutterLabelVisibleClass: conditional(
    'gutterLabelVisible',
    raw('gutter-label-visible'),
    raw('gutter-label-hidden')
  ),

  gutterLabelVisible: reads('singleDatasetIsSelected'),

  singleDatasetIsSelected: bool('selectedSingleDataset'),

  selectedSingleDataset: conditional(
    and(
      equal('selectedItems.length', raw(1)),
      notEqual('selectedItems.firstObject', 'browsableDataset'),
    ),
    'selectedItems.firstObject',
    raw(null)
  ),

  selectedSecondaryIds: conditional(
    'archiveId',
    'selectedFiles',
    'selectedArchives',
  ),

  spaceIdObserver: observer('spaceId', function spaceIdObserver() {
    this.get('containerScrollTop')(0);
  }),

  clearSelectedObserver: observer(
    'attachmentState',
    async function clearSelectedObserver() {
      if (this.get('lockSelectedReset')) {
        return;
      }
      if (this.get('selectedItems.length') > 0) {
        await this.changeSelectedItems([]);
      }
    }
  ),

  init() {
    this._super(...arguments);
    this.set('browserModel', this.createDatasetBrowserModel());
  },

  /**
   * @override
   */
  didInsertElement() {
    const splitGrid = SplitGrid({
      rowGutters: [{
        track: 1,
        element: this.element.querySelector('.gutter-row-1'),
      }],
      sizes: [10, 1],
      minSize: 200,
      onDragEnd: (...args) => this.onGutterDragEnd(...args),
    });
    this.set('splitGrid', splitGrid);
  },

  /**
   * @override
   */
  willDestroyElement() {
    try {
      const {
        browserModel,
        splitGrid,
      } = this.getProperties('browserModel', 'splitGrid');
      if (browserModel) {
        browserModel.destroy();
      }
      if (splitGrid) {
        splitGrid.destroy();
      }
    } finally {
      this._super(...arguments);
    }
  },

  /**
   * Handler of `onDragEnd` of `split-grid`.
   * See https://github.com/nathancahill/split/tree/master/packages/split-grid
   * for details.
   */
  onGutterDragEnd( /* direction, track */ ) {
    const {
      datasetBrowserApi,
      archiveBrowserApi,
    } = this.getProperties('datasetBrowserApi', 'archiveBrowserApi');
    if (datasetBrowserApi) {
      datasetBrowserApi.recomputeTableItems();
    }
    if (archiveBrowserApi) {
      archiveBrowserApi.recomputeTableItems();
    }
  },

  getEmptyFetchChildrenResponse() {
    return {
      childrenRecords: [],
      isLast: true,
    };
  },

  async resolveDatasetForSelectedIds(selectedIds) {
    const {
      spaceDatasetsRoot,
      parentAppNavigation,
    } = this.getProperties('spaceDatasetsRoot', 'parentAppNavigation');

    if (isEmpty(selectedIds)) {
      // no dir nor selected files provided - go home
      return this.get('spaceDatasetsRoot');
    } else {
      const redirectOptions = await this.resolveSelectedParentDatasetUrl();
      if (redirectOptions) {
        parentAppNavigation.openUrl(redirectOptions.dataUrl, true);
        return (await redirectOptions.datasetProxy) || spaceDatasetsRoot;
      } else {
        // resolving parent from selection failed - fallback to home
        return spaceDatasetsRoot;
      }
    }
  },

  /**
   * Optionally computes Onezone URL redirect options for containing parent dataset of
   * first selected file-type dataset (if there is no injected dataset ID and at least one
   * selected dataset provided).
   * If there is no need to redirect, resolves false.
   * @returns {Promise<{dataUrl: string, dirProxy: PromiseObject}>}
   */
  async resolveSelectedParentDatasetUrl() {
    const {
      datasetId,
      selectedDatasets,
      selectedArchives,
      selectedFiles,
      datasetManager,
      archiveId,
      dirId,
    } = this.getProperties(
      'datasetId',
      'selectedDatasets',
      'selectedArchives',
      'selectedFiles',
      'datasetManager',
      'archiveId',
      'dirId'
    );
    const firstSelectedId = selectedDatasets && selectedDatasets[0];

    if (datasetId || !firstSelectedId) {
      // no need to resolve parent dataset, as it is already specified or there is no
      // selection specified
      return null;
    }

    let firstSelectedItem;
    try {
      firstSelectedItem = await datasetManager.getBrowsableDataset(firstSelectedId);
    } catch (error) {
      console.debug(
        `component:content-file-browser#resolveSelectedParentDatasetUrl: cannot resolve first selected dataset: "${error}"`
      );
      return null;
    }
    const parentId = firstSelectedItem && firstSelectedItem.relationEntityId('parent');
    if (parentId) {
      const dataUrl = this.callParent(
        'getDatasetsUrl', {
          datasetId: parentId,
          selectedDatasets,
          selectedArchives: isEmpty(selectedArchives) ? null : selectedArchives,
          selectedFiles: isEmpty(selectedFiles) ? null : selectedFiles,
          archive: archiveId || null,
          dir: dirId || null,
        }
      );
      return {
        dataUrl,
        datasetProxy: datasetManager.getBrowsableDataset(firstSelectedItem),
      };
    } else {
      return null;
    }
  },

  async getDatasetsForView(ids) {
    if (!ids) {
      return [];
    }

    const {
      datasetManager,
      spaceId,
      attachmentState,
      datasetId,
    } = this.getProperties('datasetManager', 'spaceId', 'attachmentState', 'datasetId');
    const datasets =
      await onlyFulfilledValues(ids.map(id =>
        datasetManager.getBrowsableDataset(id)
      ));
    // allow only dataset which belong to current space, are in currently
    // chosen state and have parent of currently chosen dataset
    return datasets.filter(dataset => {
      if (!dataset || !dataset.relationEntityId) {
        return false;
      }
      const currentParentId = datasetId ?
        (datasetId === spaceDatasetsRootId ? null : datasetId) : null;
      return get(dataset, 'spaceId') === spaceId &&
        get(dataset, 'state') === attachmentState &&
        (dataset.relationEntityId('parent') || null) === currentParentId;
    });
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

  createDatasetBrowserModel() {
    return DatasetBrowserModel.create({
      ownerSource: this,
      spaceDatasetsViewState: this,
      disableReJumps: true,
      getDataUrl: this.getDataUrl.bind(this),
      getDatasetsUrl: this.getDatasetsUrl.bind(this),
      openProtectionModal: this.openProtectionModal.bind(this),
      openCreateArchiveModal: this.openCreateArchiveModal.bind(this),
      openDatasetOpenModal: this.openDatasetOpenModal.bind(this),
      openArchivesView: this.openArchivesView.bind(this),
    });
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

  async browserizeDatasets({ childrenRecords, isLast }) {
    const datasetManager = this.get('datasetManager');
    return {
      childrenRecords: await allFulfilled(childrenRecords.map(r =>
        datasetManager.getBrowsableDataset(r)
      )),
      isLast,
    };
  },

  /**
   * @param {Utils.BrowsableDataset} dataset
   * @param {Models.File} file root file of selected dataset
   */
  openProtectionModal(dataset, file) {
    this.setProperties({
      datasetToShowProtection: dataset,
      fileToShowProtection: file,
    });
  },

  closeProtectionModal() {
    this.setProperties({
      datasetToShowProtection: null,
      fileToShowProtection: null,
    });
  },

  openDatasetOpenModal(dataset) {
    this.set('fileToShowDatasetOpen', dataset);
  },

  closeDatasetOpenModal() {
    this.set('fileToShowDatasetOpen', null);
  },

  /**
   * @param {Models.Dataset} dataset dataset for which create archive form will be shown
   * @param {Object} options
   */
  openCreateArchiveModal(dataset, options) {
    this.setProperties({
      datasetToCreateArchive: dataset,
      createArchiveOptions: options,
    });
  },

  closeCreateArchiveModal() {
    this.set('datasetToCreateArchive', null);
  },

  async submitArchiveCreate(dataset, archiveData) {
    const {
      archiveManager,
      parentAppNavigation,
    } = this.getProperties('archiveManager', 'parentAppNavigation');
    const archive = await archiveManager.createArchive(dataset, archiveData);
    try {
      const datasetId = get(dataset, 'entityId');
      const archiveId = get(archive, 'entityId');
      const archiveSelectUrl = this.getDatasetsUrl({
        datasetId: dataset.relationEntityId('parent'),
        selectedDatasets: [datasetId],
        archive: null,
        selectedArchives: [archiveId],
        dir: null,
        selectedFiles: null,
      });
      if (archiveSelectUrl) {
        parentAppNavigation.openUrl(archiveSelectUrl);
      }
    } catch (error) {
      console.error(
        `component:content-space-dataset#submitArchiveCreate: selecting newly created archive failed: ${error}`
      );
    }
    return archive;
  },

  async openArchivesView(dataset) {
    const datasetId = dataset && get(dataset, 'entityId');
    if (datasetId) {
      this.callParent('updateDatasetId', null);
      this.callParent('updateSelectedDatasets', [datasetId]);
    }
  },

  actions: {
    /**
     * @param {String} itemId datasetId, archiveVirtualRootDirId or fileId (dir)
     */
    async updateDatasetId(itemId) {
      this.callParent('updateDatasetId', itemId);
    },
    async changeSelectedItems(selectedItems) {
      const {
        selectedItems: currentSelectedItems,
        browsableDataset,
      } = this.getProperties('selectedItems', 'browsableDataset');
      // clearing archive and dir clears secondary browser - it should be done only
      // if selected dataset is changed; in other circumstances it is probably initial
      // selection change (after jump) or some unnecessary url update
      if (
        !isEmpty(currentSelectedItems) &&
        !_.isEqual(currentSelectedItems, selectedItems)
      ) {
        this.callParent('updateArchiveId', null);
        this.callParent('updateDirId', null);
        // TODO: VFS-8737 try to make proper wait-for-shared-properties method
        await sleep(throttleTimeout * 2);
      }
      await this.changeSelectedItems(selectedItems);

      // single selected dataset should be stored in URL - user can navigate with
      // prev/next when selects single dataset for browsing;
      // also a current "dir" could be selected, but should not be stored in URL
      const isChangeStoredInUrl = selectedItems.length === 1 &&
        selectedItems[0] !== browsableDataset;
      // only one method of updating component selectedItems to new value should be used,
      // because they are both async and cause random error when used both
      if (isChangeStoredInUrl) {
        this.callParent('updateSelectedDatasets', selectedItems.mapBy('entityId'));
      } else {
        // clear selection in URL, because this selection should not be stored
        this.callParent('updateSelectedDatasets', null);
      }
    },
    updateArchiveId(archiveId) {
      this.callParent('updateArchiveId', archiveId);
    },
    updateDirId(dirId) {
      this.callParent('updateDirId', dirId);
    },
    containerScrollTop() {
      return this.get('containerScrollTop')(...arguments);
    },
    async resolveItemParent(item) {
      if (!item) {
        return null;
      }
      const itemEntityId = get(item, 'entityId');
      if (itemEntityId === spaceDatasetsRootId) {
        // space root
        return null;
      } else if (!get(item, 'hasParent')) {
        // tree top
        return this.get('spaceDatasetsRoot');
      } else {
        // regular dataset
        return get(item, 'parent');
      }
    },
    async fetchChildren(...fetchArgs) {
      const {
        isInRoot,
        browsableDatasetProxy,
      } = this.getProperties(
        'isInRoot',
        'browsableDatasetProxy',
      );
      // a workaround for fb-table trying to get children when it have not-updated "dir"
      if (!get(browsableDatasetProxy, 'isSettled')) {
        return this.getEmptyFetchChildrenResponse();
      }

      if (isInRoot) {
        return this.fetchSpaceDatasets(...fetchArgs);
      } else {
        return this.fetchDatasetChildren(...fetchArgs);
      }
    },
  },
});
