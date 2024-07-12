/**
 * Container for browsing and managing datasets.
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OneEmbeddedComponent from 'oneprovider-gui/components/one-embedded-component';
import { inject as service } from '@ember/service';
import { computed, get, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import ContentSpaceBaseMixin from 'oneprovider-gui/mixins/content-space-base';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/i18n';
import {
  promise,
  raw,
  bool,
  conditional,
  equal,
  and,
  notEqual,
  array,
  collect,
  not,
} from 'ember-awesome-macros';
import { all as allFulfilled } from 'rsvp';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import DatasetBrowserModel, {
  spaceDatasetsRootId,
  SpaceDatasetsRootClass,
} from 'oneprovider-gui/utils/dataset-browser-model';
import onlyFulfilledValues from 'onedata-gui-common/utils/only-fulfilled-values';
import ItemBrowserContainerBase from 'oneprovider-gui/mixins/item-browser-container-base';
import { isEmpty } from '@ember/utils';
import SplitGrid from 'split-grid';
import _ from 'lodash';
import computedT from 'onedata-gui-common/utils/computed-t';
import { createPrivilegeExpression } from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import waitForRender from 'onedata-gui-common/utils/wait-for-render';
import { getFileGri } from 'oneprovider-gui/models/file';

const mixins = [
  I18n,
  ContentSpaceBaseMixin,
  ItemBrowserContainerBase,
];

export default OneEmbeddedComponent.extend(...mixins, {
  classNames: ['content-space-datasets', 'content-items-browser'],
  classNameBindings: ['noViewArchivesPrivilege:no-archives-view'],

  /**
   * @override
   */
  i18nPrefix: 'components.contentSpaceDatasets',

  datasetManager: service(),
  spaceManager: service(),
  globalNotify: service(),
  archiveManager: service(),
  parentAppNavigation: service(),
  isMobile: service(),
  appProxy: service(),
  i18n: service(),

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
   * **Injected from parent frame.**
   * @virtual optional
   * @type {FilesystemBrowserModel.Command}
   */
  fileAction: null,

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
    'fileAction',
  ]),

  /**
   * @override
   */
  iframeInjectedNavigationProperties: Object.freeze([
    'spaceId',
    'datasetId',
    'archiveId',
    'dirId',
    'attachmentState',
    'fileAction',
  ]),

  /**
   * Minimum height in pixels that a section (upper or lower part) can have.
   * @type {number}
   */
  sectionMinHeight: 200,

  /**
   * Initialized on `didInsertElement`.
   * @type {Split} see `split-grid` NPM package
   */
  splitGrid: undefined,

  /**
   * Set to true in `updateContainersClasses` if panel with datasets browser is lower
   * than some breakpoint. Causes adding special styles for low-height panels.
   * @type {Boolean}
   */
  datasetContainerLowHeight: false,

  /**
   * Set to true in `updateContainersClasses` if panel with archive browser is lower
   * than some breakpoint. Causes adding special styles for low-height panels.
   * @type {Boolean}
   */
  archiveContainerLowHeight: false,

  ignoreCommonSelector: '#content-scroll, .modal',

  /**
   * Ignore deselect selector for dataset browser.
   * See `component:file-browser#ignoreDeselectSelector` purpose.
   * @type {String}
   */
  ignoreDatasetDeselectSelector: array.join(
    collect(
      'ignoreCommonSelector',
      raw('.archive-browser-container'),
      raw('.archive-browser-container *'),
      raw('.dataset-browser-container .ps__rail-y'),
      raw('.dataset-browser-container .ps__rail-y *'),
    ),
    raw(',')
  ),

  /**
   * Ignore deselect selector for archive browser.
   * See `component:file-browser#ignoreDeselectSelector` purpose.
   * @type {String}
   */
  ignoreArchiveDeselectSelector: array.join(
    collect(
      'ignoreCommonSelector',
      raw('.dataset-browser-container'),
      raw('.dataset-browser-container *'),
      raw('.archive-browser-container .ps__rail-y'),
      raw('.archive-browser-container .ps__rail-y *'),
    ),
    raw(',')
  ),

  /**
   * Set on init.
   * @type {Utils.DatasetBrowserModel}
   */
  browserModel: undefined,

  //#region browser items for various modals

  datasetToCreateArchive: undefined,

  /**
   * Injected options for archive creation.
   * @type {CreateArchiveOptions}
   */
  createArchiveOptions: undefined,

  datasetToShowProtection: null,

  fileToShowProtection: null,

  //#endregion

  /**
   * @override
   */
  selectedItemsForJumpProxy: promise.object(computed(
    'spaceId',
    'datasetId',
    'selectedDatasets',
    async function selectedItemsForJumpProxy() {
      return this.getDatasetsForView(this.selectedDatasets);
    }
  )),

  dirGri: computed('dirId', function dirGri() {
    return getFileGri(this.dirId, 'private');
  }),

  spaceProxy: promise.object(computed('spaceId', function spaceProxy() {
    const {
      spaceManager,
      spaceId,
    } = this.getProperties('spaceManager', 'spaceId');
    return spaceManager.getSpace(spaceId);
  })),

  space: reads('spaceProxy.content'),

  /**
   * @type {ComputedProperty<SpacePrivileges>}
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

  // FIXME: czy to jest gdzieś używane?
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
   * Proxy for whole file-browser: loading causes loading screen, recomputing causes
   * `file-browser` to be re-rendered.
   * @type {PromiseObject}
   */
  initialRequiredDataProxy: promise.object(computed(
    'spaceProxy',
    'initialBrowsableDatasetProxy',
    'initialSelectedItemsForJumpProxy',
    function initialRequiredDataProxy() {
      const proxies = [
        this.spaceProxy,
        this.initialBrowsableDatasetProxy,
        this.initialSelectedItemsForJumpProxy,
      ];
      return allFulfilled(proxies);
    }
  )),

  gutterLabelVisibleClass: conditional(
    'gutterLabelVisible',
    raw('gutter-label-visible'),
    raw('gutter-label-hidden')
  ),

  gutterLabelVisible: and(not('noViewArchivesPrivilege'), 'singleDatasetIsSelected'),

  singleDatasetIsSelected: bool('selectedSingleDataset'),

  selectSingleDatasetText: conditional(
    'isMobile.any',
    computedT('selectSingleDatasetMobile'),
    computedT('selectSingleDataset')
  ),

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

  noViewArchivesPrivilege: not('spacePrivileges.viewArchives'),

  viewPrivilegeExpression: computed(function viewPrivilegeExpression() {
    const i18n = this.get('i18n');
    return createPrivilegeExpression(i18n, 'space', 'space_view_archives');
  }),

  spaceIdObserver: observer('spaceId', function spaceIdObserver() {
    this.get('containerScrollTop')(0);
  }),

  clearSelectedObserver: observer(
    'attachmentState',
    function clearSelectedObserver() {
      if (this.get('lockSelectedReset')) {
        return;
      }
      if (this.get('selectedItems.length') > 0) {
        this.changeSelectedItems([]);
      }
    }
  ),

  init() {
    this._super(...arguments);
    (async () => {
      await this.initialRequiredDataProxy;
      this.set('browserModel', this.createDatasetBrowserModel());
    })();
  },

  /**
   * @override
   */
  didInsertElement() {
    const sectionMinHeight = this.get('sectionMinHeight');
    const splitGrid = SplitGrid({
      rowGutters: [{
        track: 1,
        element: this.element.querySelector('.gutter-row-1'),
      }],
      minSize: sectionMinHeight,
      onDragEnd: (...args) => this.onGutterDragEnd(...args),
    });
    this.set('splitGrid', splitGrid);
    this.initialRequiredDataProxy.finally(async () => {
      await waitForRender();
      this.updateContainersClasses();
    });
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
    this.updateContainersClasses();
    if (datasetBrowserApi) {
      datasetBrowserApi.recomputeTableItems();
    }
    if (archiveBrowserApi) {
      archiveBrowserApi.recomputeTableItems();
    }
  },

  updateContainersClasses() {
    if (!this.element || !this.initialRequiredDataProxy.isSettled) {
      return;
    }

    const lowHeightBreakpoint = 300;
    const datasetBrowserContainer =
      this.element.querySelector('.dataset-browser-container');
    const archiveBrowserContainer =
      this.element.querySelector('.archive-browser-container');

    this.set(
      'datasetContainerLowHeight',
      datasetBrowserContainer &&
      datasetBrowserContainer.clientHeight <= lowHeightBreakpoint
    );
    this.set(
      'archiveContainerLowHeight',
      archiveBrowserContainer &&
      archiveBrowserContainer.clientHeight <= lowHeightBreakpoint
    );
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
    return ContentSpaceDatasetsBrowserModel.create({
      selectedItemsForJump: this.selectedItemsForJumpProxy.content,
      contentSpaceDatasets: this,
      ownerSource: this,
      spaceDatasetsViewState: this,
      disableReJumps: true,
      getDataUrl: this.getDataUrl.bind(this),
      getDatasetsUrl: this.getDatasetsUrl.bind(this),
      openProtectionModal: this.openProtectionModal.bind(this),
      openCreateArchiveModal: this.openCreateArchiveModal.bind(this),
      openArchivesView: this.openArchivesView.bind(this),
    });
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
      await this.updateSelectedDatasetsInUrl([datasetId]);
    }
  },

  async updateSelectedDatasetsInUrl(selectedDatasets) {
    this.callParent('updateSelectedDatasets', selectedDatasets);
    await this.get('appProxy').waitForNextFlush();
  },

  actions: {
    /**
     * @param {String} itemId datasetId, archiveVirtualRootDirId or fileId (dir)
     */
    async updateDatasetId(itemId) {
      this.callParent('updateDatasetId', itemId);
      await this.get('appProxy').waitForNextFlush();
    },
    async updateArchiveId(archiveId) {
      this.callParent('updateArchiveId', archiveId);
      await this.get('appProxy').waitForNextFlush();
    },
    async updateDirId(dirId) {
      this.callParent('updateDirId', dirId);
      await this.get('appProxy').waitForNextFlush();
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
  },
});

const ContentSpaceDatasetsBrowserModel = DatasetBrowserModel.extend({
  /**
   * @virtual
   * @type {Components.ContentSpaceDatasets}
   */
  contentSpaceDatasets: undefined,

  dirProxy: reads('contentSpaceDatasets.browsableDatasetProxy'),

  changeSelectedItems(newSelectedItems) {
    const oldSelectedItems = this.selectedItems;
    if (_.isEqual(oldSelectedItems, newSelectedItems)) {
      return;
    }

    const isSingleSelected = newSelectedItems && newSelectedItems.length === 1;
    const isChangeStoredInUrl =
      newSelectedItems[0] !== this.contentSpaceDatasets.browsableDataset;

    this._super(...arguments);

    (async () => {
      // Clearing archive and dir clears secondary browser - it should be done only
      // if selected dataset is changed; in other circumstances it is probably initial
      // selection change (after jump) or some unnecessary url update.
      if (!isEmpty(oldSelectedItems)) {
        this.contentSpaceDatasets.callParent('updateArchiveId', null);
        this.contentSpaceDatasets.callParent('updateDirId', null);
        if (isSingleSelected) {
          // When changing to other specific dataset, archiveId and dirId should be
          // cleared before dataset change to prevent injecting wrong ids set to
          // dataset-archives-browser (eg. incompatible dir for currently opened dataset).
          // Unfortunately it could cause showing archives list for a short period, but in
          // current architecture there is no simple solution for this issue.
          // We cannot change dataset in URL here because of blink-scroll animation
          // prevention (see comment below).
          await this.contentSpaceDatasets.appProxy.waitForNextFlush();
        }
      }
      // Single selected dataset should be stored in URL - user can navigate with
      // prev/next when selects single dataset for browsing.
      // Also a current dataset-dir could be selected, but should not be stored in URL.
      const externalUpdate = (isChangeStoredInUrl && isSingleSelected) ? [
        get(newSelectedItems[0], 'entityId'),
      ] : null;
      await this.contentSpaceDatasets.updateSelectedDatasetsInUrl(externalUpdate);
    })();
  },

  // FIXME: ???
  // Be prepared for injected selected items change which will be done async -
  // it prevents blink animation and scrolling to selected dataset.
});
