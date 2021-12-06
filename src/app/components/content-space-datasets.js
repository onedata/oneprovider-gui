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
  fileManager: service(),
  filesViewResolver: service(),
  onedataNavigation: service(),

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
   * IDs of selected datasets.
   * Single selected dataset means that its archives browser will be rendered.
   * @virtual optional
   * @type {Array<String>}
   */
  selected: undefined,

  /**
   * **Injected from parent frame.**
   * IDs of selected archives or files (for secondary browser).
   * @virtual optional
   * @type {Array<String>}
   */
  selectedSecondary: undefined,

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
    'selected',
    'selectedSecondary',
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
    'selected',
    async function selectedItemsForJumpProxy() {
      const selected = this.get('selected');
      return this.getDatasetsForView(selected);
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
        selected,
      } = this.getProperties(
        'datasetManager',
        'globalNotify',
        'datasetId',
        'spaceDatasetsRoot',
        'spaceId',
        'selected',
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
        return this.resolveDatasetForSelectedIds(selected);
      }
    }
  )),

  /**
   * @type {Models.Dataset}
   */
  browsableDataset: computedLastProxyContent('browsableDatasetProxy'),

  // FIXME: implement auto-redirect to dir in other dataset here or in archives panel (dirProxy)

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
      onedataNavigation,
    } = this.getProperties('spaceDatasetsRoot', 'onedataNavigation');

    if (isEmpty(selectedIds)) {
      // no dir nor selected files provided - go home
      return this.get('spaceDatasetsRoot');
    } else {
      const redirectOptions = await this.resolveSelectedParentDatasetUrl();
      if (redirectOptions) {
        onedataNavigation.openUrl(redirectOptions.dataUrl, true);
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
      selected,
      selectedSecondary,
      datasetManager,
      archiveId,
      dirId,
    } = this.getProperties(
      'datasetId',
      'selected',
      'selectedSecondary',
      'datasetManager',
      'archiveId',
      'dirId'
    );
    const firstSelectedId = selected && selected[0];

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
          selected,
          selectedSecondary: isEmpty(selectedSecondary) ? null : selectedSecondary,
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
    } = this.getProperties('datasetManager', 'spaceId', 'attachmentState');
    const datasets =
      await onlyFulfilledValues(ids.map(id =>
        datasetManager.getBrowsableDataset(id)
      ));
    try {
      // allow only dataset which belong to current space and are in currently
      // chosen state
      return datasets.filter(dataset =>
        get(dataset, 'spaceId') === spaceId && get(dataset, 'state') === attachmentState
      );
    } catch (error) {
      return [];
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

  createDatasetBrowserModel() {
    return DatasetBrowserModel.create({
      ownerSource: this,
      spaceDatasetsViewState: this,
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
      onedataNavigation,
    } = this.getProperties('archiveManager', 'onedataNavigation');
    const archive = await archiveManager.createArchive(dataset, archiveData);
    try {
      const datasetId = get(dataset, 'entityId');
      const archiveId = get(archive, 'entityId');
      const archiveSelectUrl = this.getDatasetsUrl({
        datasetId: dataset.relationEntityId('parent'),
        selected: [datasetId],
        archive: null,
        selectedSecondary: [archiveId],
        dir: null,
      });
      if (archiveSelectUrl) {
        onedataNavigation.openUrl(archiveSelectUrl);
      }
    } catch (error) {
      console.error(
        `component:content-space-dataset#submitArchiveCreate: selecting newly created archive failed: ${error}`
      );
    }
    return archive;
  },

  openArchivesView(dataset) {
    const datasetId = dataset && get(dataset, 'entityId');
    if (datasetId) {
      this.callParent('updateSelected', [datasetId]);
    }
  },

  actions: {
    /**
     * @param {String} itemId datasetId, archiveVirtualRootDirId or fileId (dir)
     */
    async updateDirEntityId(itemId) {
      this.callParent('updateDatasetId', itemId);
    },
    async changeSelectedItems(selectedItems) {
      const {
        selectedItems: currentSelectedItems,
        browsableDataset,
      } = this.getProperties('selectedItems', 'browsableDataset');
      // single selected dataset should be stored in URL - user can navigate with
      // prev/next when selects single dataset for browsing;
      // alsp a current "dir" could be selected, but should not be stored in URL
      const isChangeStoredInUrl = selectedItems.length === 1 &&
        selectedItems[0] !== browsableDataset;
      // clearing archive and dir clears secondary browser - it should be done only
      // if selected dataset is changed; in other circumstances it is probably initial
      // selection change (after jump) or some unnecessary url update
      if (
        !isEmpty(currentSelectedItems) &&
        !_.isEqual(currentSelectedItems, selectedItems)
      ) {
        this.callParent('updateArchiveId', null);
        this.callParent('updateDirId', null);
      }
      // only one method of updating component selectedItems to new value should be used,
      // because they are both async and cause random error when used both
      if (isChangeStoredInUrl) {
        this.callParent('updateSelected', selectedItems.mapBy('entityId'));
      } else {
        // clear selection in URL, because this selection should not be stored
        this.callParent('updateSelected', null);
      }
      // FIXME: a probably bug in createThrottledFunction prevents to make a waitForFlush
      await sleep(throttleTimeout + 1);
      await this.changeSelectedItems(selectedItems);
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
    // FIXME: reimplement
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
