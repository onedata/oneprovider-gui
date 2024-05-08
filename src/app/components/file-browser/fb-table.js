/**
 * A container with table of files (children of selected dir).
 * Supports infinite scroll.
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import EmberObject, {
  get,
  computed,
  observer,
  setProperties,
  getProperties,
} from '@ember/object';
import isPopoverOpened from 'onedata-gui-common/utils/is-popover-opened';
import { reads } from '@ember/object/computed';
import $ from 'jquery';
import ReplacingChunksArray from 'onedata-gui-common/utils/replacing-chunks-array';
import { inject as service } from '@ember/service';
import ListWatcher from 'onedata-gui-common/utils/list-watcher';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { htmlSafe, camelize } from '@ember/string';
import { scheduleOnce, next, later } from '@ember/runloop';
import { getButtonActions } from 'oneprovider-gui/components/file-browser';
import { equal, and, not, or, raw, bool, eq } from 'ember-awesome-macros';
import { all as allFulfilled, allSettled, defer } from 'rsvp';
import _ from 'lodash';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import ViewTester from 'onedata-gui-common/utils/view-tester';
import { A } from '@ember/array';
import { isEmpty } from '@ember/utils';
import sleep from 'onedata-gui-common/utils/sleep';
import animateCss from 'onedata-gui-common/utils/animate-css';
import dom from 'onedata-gui-common/utils/dom';
import waitForRender from 'onedata-gui-common/utils/wait-for-render';
import globals from 'onedata-gui-common/utils/globals';

/**
 * API object exposed by `fb-table` component, be used to control the component and read
 * data that should be publicly available for other items browser components.
 * @typedef {EmberObject} FbTableApi
 */

/**
 * @typedef {Object} FbTableRefreshOptions
 * @property {boolean} forced If true, the refresh will be added to queue even if another
 *   refresh is already queued.
 * @property {boolean} animated If true, show spinner over the list while the refresh is
 *   performed.
 */

const defaultIsItemDisabled = () => false;

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  classNames: ['fb-table'],
  classNameBindings: [
    'hasEmptyDirClass:empty-dir',
    'dirLoadError:error-dir',
    'specialViewClass:special-dir-view',
    'refreshDefer:refresh-started',
  ],
  attributeBindings: ['tabIndex'],

  fileManager: service(),
  i18n: service(),
  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbTable',

  /**
   * @virtual
   * @type {Utils.BaseBrowserModel}
   */
  browserModel: undefined,

  /**
   * @virtual
   * @type {SpacePrivileges}
   */
  spacePrivileges: Object.freeze({}),

  /**
   * @virtual
   * @type {Boolean}
   */
  isSpaceOwned: undefined,

  /**
   * @virtual
   * @type {string}
   */
  selectionContext: undefined,

  /**
   * @virtual optional
   * @type {Array<models/File>}
   */
  selectedItemsForJump: undefined,

  /**
   * @virtual
   * @type {Array<models/File>}
   */
  selectedItems: undefined,

  /**
   * @virtual
   * @type {Array<Object>}
   */
  allButtonsArray: undefined,

  /**
   * @virtual
   * @type {string}
   */
  fileClipboardMode: undefined,

  /**
   * @virtual
   * @type {Array<Models.File>}
   */
  fileClipboardFiles: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  changeSelectedItems: notImplementedThrow,

  /**
   * @virtual
   * @type {(item: Object) => boolean}
   */
  isItemDisabledFunction: defaultIsItemDisabled,

  /**
   * @virtual optional
   * @type {(api: FbTableApi) => undefined}
   */
  registerApi: notImplementedIgnore,

  /**
   * @virtual optional
   * @type {Function}
   */
  containerScrollTop: notImplementedIgnore,

  /**
   * @virtual
   * @type {boolean}
   */
  previewMode: false,

  /**
   * An element that serves as scrollable parent of items table.
   * Scrolling this element can cause invocation of additional items loading.
   * @virtual
   * @type {HTMLElement}
   */
  contentScroll: undefined,

  /**
   * Set to true, if there are no actions suitable to use on single or multiple items row.
   * @virtual optional
   */
  noItemsActions: false,

  /**
   * @virtual
   * @type {Function}
   */
  invokeFileAction: notImplementedThrow,

  /**
   * @virtual
   * @type {(file: Models.File, confirmModal?: Boolean) => any}
   */
  openFile: notImplementedIgnore,

  /**
   * Element attribute binding.
   * Allows to listen for keyboard events.
   */
  tabIndex: '0',

  /**
   * @type {EmberArray<String>}
   */
  loadingIconFileIds: undefined,

  /**
   * @type {Boolean}
   */
  renderRefreshSpinner: false,

  changeDir: undefined,

  /**
   * @type {Array<String>}
   */
  rowFocusAnimationClasses: Object.freeze(['animate-attention', 'slow']),

  /**
   * JS time when context menu was last repositioned
   * @type {Number}
   */
  contextMenuRepositionTime: 1,

  /**
   * Set by `one-webui-popover.registerApi` in HBS.
   * Undefined if not rendering context menu.
   * @type {Object} API of `one-webui-popover`
   */
  contextMenuApi: undefined,

  /**
   * @type {models/File}
   */
  lastSelectedFile: undefined,

  /**
   * @type {RSVP.Deferred}
   */
  refreshDefer: null,

  rowHeight: 61,

  /**
   * When scroll position is changed by code, use this flag to ignore next scroll event
   * @type {Boolean}
   */
  ignoreNextScroll: false,

  fetchingPrev: false,

  fetchingNext: false,

  /**
   * @type {boolean}
   */
  headerVisible: undefined,

  headRowComponentName: or(
    'browserModel.headRowComponentName',
    raw('file-browser/fb-table-head-row')
  ),

  headFirstCellComponentName: or(
    'browserModel.headFirstCellComponentName',
    raw('file-browser/fb-table-head-first-cell')
  ),

  rowComponentName: or(
    'browserModel.rowComponentName',
    raw('file-browser/fb-table-row')
  ),

  dirLoadErrorComponentName: or(
    'browserModel.dirLoadErrorComponentName',
    raw('file-browser/fb-dir-load-error')
  ),

  emptyDirComponentName: or(
    'browserModel.emptyDirComponentName',
    raw('file-browser/fb-empty-dir')
  ),

  headStatusBarComponentName: reads('browserModel.headStatusBarComponentName'),

  dir: reads('browserModel.dir'),

  dirError: reads('browserModel.dirError'),

  /**
   * If true, files table will not jump to changed `itemsForJump` if these items are
   * already selected.
   * @type {ComputedProperty<Boolean>}
   */
  disableReJumps: reads('browserModel.disableReJumps'),

  /**
   * When true, allow to select only single item on list.
   * @type {ComputedProperty<Boolean>}
   */
  singleSelect: bool(or('browserModel.singleSelect', 'previewMode')),

  disabledItems: computed(
    'isItemDisabledFunction',
    'filesArray.[]',
    function disabledItems() {
      const {
        isItemDisabledFunction,
        filesArray,
      } = this.getProperties(
        'isItemDisabledFunction',
        'filesArray'
      );
      return filesArray.filter(item => isItemDisabledFunction(item));
    }
  ),

  selectionCount: reads('selectedItems.length'),

  viewTester: computed('contentScroll', function viewTester() {
    if (!this.contentScroll) {
      return null;
    }
    const $contentScroll = $(this.contentScroll);
    return new ViewTester($contentScroll);
  }),

  /**
   * @type {ComputedProperty<Array<String>>}
   */
  conflictNames: computed('filesArray.sourceArray.@each.originalName', function conflictNames() {
    const namesCount = _.countBy(
      this.get('filesArray.sourceArray').mapBy('originalName'),
      name => name,
    );
    const namesUsedMultipleTimes = Object.entries(namesCount)
      .filter(([, count]) => count > 1)
      .map(([name]) => name);
    return namesUsedMultipleTimes;
  }),

  listLoadState: reads('browserModel.listLoadState'),

  /**
   * True if there is initially loaded file list, but it is empty.
   * False if there is initially loaded file list, but it is not empty or
   * the list was not yet loaded or cannot be loaded.
   * @type {boolean|undefined}
   */
  isDirEmpty: and(
    eq('listLoadState.state', raw('fulfilled')),
    not('filesArray.length')
  ),

  /**
   * If true, the `empty-dir` class should be added
   * @type {ComputedProperty<boolean>}
   */
  hasEmptyDirClass: and(
    equal('isDirEmpty', true),
    equal('dirLoadError', undefined),
  ),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isDirContextMenuRenderable: not('dirLoadError'),

  specialViewClass: or('hasEmptyDirClass', 'dirLoadError'),

  dirLoadError: reads('browserModel.dirViewLoadError'),

  isHardlinkingPossible: computed(
    'fileClipboardFiles.@each.type',
    function isHardlinkingPossible() {
      return !(this.get('fileClipboardFiles') || []).isAny('type', 'dir');
    }
  ),

  /**
   * When file rows are removed, we need additional space on top to fill the void.
   * If top space causes visible rows to move (eg. when new elements are added to cache
   * in front of source array), we also need to correct the actual position.
   */
  firstRowHeight: computed(
    'rowHeight',
    'filesArray._start',
    function firstRowHeight() {
      const _start = this.get('filesArray._start');
      return _start ? _start * this.get('rowHeight') : 0;
    }
  ),

  listWatcher: computed('contentScroll', function listWatcher() {
    if (!this.contentScroll) {
      return null;
    }
    return new ListWatcher(
      $(this.contentScroll),
      '.data-row',
      (items, onTop) => safeExec(this, 'onTableScroll', items, onTop),
      '.table-start-row',
    );
  }),

  /**
   * When replacing chunks array gets expanded on beginning (items are unshifted into
   * array), we need to compensate scroll because new content is added on top.
   * Currently (as of 2021) not all browsers support scroll anchoring and
   * `perfect-scrollbar` has issues with it (anchoring is disabled), so we need to do
   * scroll correction manually.
   * @param {Promise} newItemsCount how many items have been added to the beginning
   *   of the list
   */
  async adjustScroll(newItemsCount = 0) {
    const topDiff = newItemsCount * this.get('rowHeight');
    if (topDiff <= 0) {
      return;
    }
    console.debug(
      `component:file-browser/fb-table#adjustScroll: adjusting scroll by ${topDiff}`
    );
    this.set('ignoreNextScroll', true);
    this.scrollTopAfterFrameRender(topDiff, true);
  },

  async scrollTopAfterFrameRender(value = 0, isDelta = false) {
    scheduleOnce('afterRender', this, () => {
      globals.window.requestAnimationFrame(() => {
        safeExec(this, () => {
          this.get('containerScrollTop')(value, isDelta);
        });
      });
    });
  },

  firstRowStyle: computed('firstRowHeight', function firstRowStyle() {
    return htmlSafe(`height: ${this.get('firstRowHeight')}px;`);
  }),

  // TODO: VFS-8809 migrate to InfiniteScroll toolkit
  filesArray: computed('dir.entityId', 'browserModel', function filesArray() {
    const dirId = this.get('dir.entityId');
    const selectedItemsForJump = this.get('selectedItemsForJump');
    let initialJumpIndex;
    if (!isEmpty(selectedItemsForJump)) {
      const firstSelectedForJump = A(selectedItemsForJump).sortBy('index').objectAt(0);
      initialJumpIndex = get(firstSelectedForJump, 'index');
    }
    const array = ReplacingChunksArray.create({
      fetch: (...fetchArgs) =>
        this.get('fetchDirChildren')(dirId, ...fetchArgs)
        .then(({ childrenRecords, isLast }) => ({ array: childrenRecords, isLast })),
      startIndex: 0,
      endIndex: 50,
      indexMargin: 10,
      initialJumpIndex,
    });
    array.on(
      'fetchPrevStarted',
      () => this.onFetchingStateUpdate('prev', 'started')
    );
    array.on(
      'fetchPrevResolved',
      () => this.onFetchingStateUpdate('prev', 'resolved')
    );
    array.on(
      'fetchPrevRejected',
      () => this.onFetchingStateUpdate('prev', 'rejected')
    );
    array.on(
      'fetchNextStarted',
      () => this.onFetchingStateUpdate('next', 'started')
    );
    array.on(
      'fetchNextResolved',
      () => this.onFetchingStateUpdate('next', 'resolved')
    );
    array.on(
      'fetchNextRejected',
      () => this.onFetchingStateUpdate('next', 'rejected')
    );
    array.on(
      'willChangeArrayBeginning',
      async ({ updatePromise, newItemsCount }) => {
        await updatePromise;
        safeExec(this, () => {
          this.adjustScroll(newItemsCount);
        });
      }
    );
    array.on(
      'willResetArray',
      async ({ updatePromise }) => {
        await updatePromise;
        safeExec(this, () => {
          this.scrollTopAfterFrameRender();
        });
      }
    );
    return array;
  }),

  visibleFiles: reads('filesArray'),

  /**
   * Live data and functions exposed by fb-table
   * @type {ComputedProperty<FbTablApi>}
   */
  api: computed(function api() {
    return EmberObject
      .extend({
        itemsArray: reads('__fbTable__.filesArray'),
      })
      .create({
        __fbTable__: this,

        refresh: this.refresh.bind(this),

        forceSelectAndJump: async (items) => {
          await this.get('changeSelectedItems')(items);
          return this.jumpToSelection();
        },
        jump: (item) => {
          return this.jump(item);
        },
        recomputeTableItems: async () => {
          await sleep(0);
          this.get('listWatcher').scrollHandler();
        },
      });
  }),

  contextMenuButtons: computed(
    'allButtonsArray',
    'selectionContext',
    'selectionCount',
    'previewMode',
    function contextMenuButtons() {
      const {
        allButtonsArray,
        selectionContext,
        selectionCount,
        previewMode,
      } = this.getProperties(
        'allButtonsArray',
        'selectionContext',
        'selectionCount',
        'previewMode'
      );
      const menuItems = previewMode ? [] : [{
        separator: true,
        title: this.t(
          'menuSelection', { selectionCount }),
      }];
      return menuItems.concat(getButtonActions(allButtonsArray, selectionContext));
    }
  ),

  fetchDirChildren: computed(function fetchDirChildren() {
    return async (entityId, ...args) => {
      if (!this.dir) {
        return { childrenRecords: [], isLast: true };
      }
      const dirId = get(this.dir, 'entityId');
      // it shows empty directory for a while
      if (dirId !== entityId) {
        // due to incomplete async implementation in fb-table, sometimes it can ask for
        // children of dir that is not currently opened
        return { childrenRecords: [], isLast: true };
      }
      const effEntityId = get(this.dir, 'effFile.entityId') || dirId;
      return this.browserModel.fetchDirChildren(effEntityId, ...args);
    };
  }),

  apiObserver: observer('registerApi', 'api', function apiObserver() {
    const {
      registerApi,
      api,
    } = this.getProperties('registerApi', 'api');
    registerApi(api);
  }),

  // TODO: VFS-8809 this additional observer can be helpful in generic scroll toolkit
  /**
   * Change of a start or end index could be needed after source array length change
   */
  sourceArrayLengthObserver: observer(
    'filesArray.sourceArray.length',
    async function sourceArrayLengthObserver() {
      await waitForRender();
      this.listWatcher?.scrollHandler();
    }
  ),

  selectedItemsForJumpObserver: observer(
    'selectedItemsForJump',
    async function selectedItemsForJumpObserver() {
      const {
        selectedItems,
        selectedItemsForJump,
        changeSelectedItems,
        disableReJumps,
      } = this.getProperties(
        'selectedItems',
        'selectedItemsForJump',
        'changeSelectedItems',
        'disableReJumps',
      );
      if (isEmpty(selectedItemsForJump)) {
        return;
      }

      await this.get('filesArray.initialLoad');
      const alreadySelected = _.isEqual(selectedItems, selectedItemsForJump);
      if (!alreadySelected) {
        await changeSelectedItems(selectedItemsForJump);
      }
      if (!disableReJumps || !alreadySelected) {
        await this.jumpToSelection();
      }
    }
  ),

  listWatcherObserver: observer('listWatcher', async function listWatcherObserver() {
    await waitForRender();
    this.listWatcher?.scrollHandler();
  }),

  init() {
    this._super(...arguments);
    if (!this.loadingIconFileIds) {
      this.set('loadingIconFileIds', A());
    }
    this.fileManager.registerRefreshHandler(this);
    this.registerApi(this.api);
    if (get(this.filesArray, 'initialJumpIndex')) {
      get(this.filesArray, 'initialLoad').then(() => {
        this.selectedItemsForJumpObserver();
      });
    }
    this.listWatcherObserver();
  },

  /**
   * @override
   * @param {KeyboardEvent} event
   */
  keyDown(event) {
    const {
      openFile,
      selectedItems,
      selectionContext,
    } = this.getProperties(
      'openFile',
      'selectedItems',
      'selectionContext',
    );
    if (selectionContext.startsWith('single') && event.key === 'Enter') {
      openFile(selectedItems[0]);
    }
  },

  /**
   * @override
   */
  willDestroyElement() {
    try {
      this.listWatcher?.destroy();
      this.fileManager.deregisterRefreshHandler(this);
    } finally {
      this._super(...arguments);
    }
  },

  async jumpToSelection() {
    const selectedItems = this.get('selectedItems');
    return this.jump(selectedItems);
  },

  /**
   * @param {Array|Object} items
   * @returns {Promise}
   */
  async jump(items) {
    const effItem = Array.isArray(items) ? A(items).sortBy('name').objectAt(0) : items;
    const effItems = Array.isArray(items) ? items : [items];

    const {
      filesArray,
      listWatcher,
    } = this.getProperties('filesArray', 'listWatcher');
    const {
      entityId,
      index,
    } = getProperties(effItem, 'entityId', 'index');

    // ensure that array is loaded and rendered
    await get(filesArray, 'initialLoad');
    await sleep(0);

    if (!filesArray.includes(effItem)) {
      const jumpResult = await filesArray.scheduleJump(index, 50);
      if (!jumpResult) {
        console.warn(
          `component:file-browser/fb-table#jump: item with index ${index} not found after jump`
        );
        return;
      }
      // wait for render of array fragment containing item to jump
      await sleep(0);
      listWatcher?.scrollHandler();
      // wait for fetch prev/next resolve
      await this.get('filesArray').getCurrentExpandPromise();
      // wait for fetch prev/next result render
      await sleep(0);
    }

    this.focusOnRow(entityId, false);
    this.highlightAnimateRows(effItems.mapBy('entityId'));
  },

  /**
   * Scrolls to row, so it is visible to user and makes animation on it to gain user's
   * attention.
   * @param {String} rowId content of row's `data-row-id`
   * @param {Boolean} [animate] if true then use highlight animation after scroll
   * @returns {Boolean} true if row was found
   */
  focusOnRow(rowId, animate = true) {
    const [row] = this.findItemRows([rowId]);
    if (row) {
      // force handle scroll into view, because scroll adjust might disabled it
      this.set('ignoreNextScroll', false);
      row.scrollIntoView({ block: 'center' });
      if (animate) {
        scheduleOnce('afterRender', () => {
          this.highlightAnimateRows([rowId]);
        });
      }
      return true;
    } else {
      console.warn(
        `component:file-browser/fb-table#focusOnRow: no row element found for "${rowId}"`
      );
      return false;
    }
  },

  highlightAnimateRows(rowsIds) {
    const rowFocusAnimationClasses = this.get('rowFocusAnimationClasses');
    const rowElements = this.findItemRows(rowsIds);
    /** @type {Array<HTMLTableCellElement>} */
    const cellElements = _.flatten(
      [...rowElements].map(row => [...row.querySelectorAll(':scope > td')])
    );
    cellElements.forEach(rowElement => {
      animateCss(rowElement, ...rowFocusAnimationClasses);
    });
  },

  /**
   * For given row ids, retuns list of rendered table rows ordered as in DOM
   * (not as specified in `rowIds`).
   * @param {Array<String>} rowsIds
   * @returns {NodeListOf<HTMLTableRowElement>}
   */
  findItemRows(rowsIds) {
    const selector = rowsIds.map(rowId => `[data-row-id="${rowId}"]`).join(',');
    return this.get('element').querySelectorAll(selector);
  },

  /**
   * Get element and its index in rendered rows collection for first file row that
   * is visible on list
   * @returns {{ element: HTMLElement, renderedRowIndex: Number }}
   */
  getFirstVisibleRow() {
    const {
      viewTester,
      element,
    } = this.getProperties('viewTester', 'element');
    let firstRow;
    let renderedRowIndex;
    $(element).find('[data-row-id]').each((index, element) => {
      if (viewTester.isInView(element)) {
        renderedRowIndex = index;
        firstRow = element;
        return false;
      } else {
        return true;
      }
    });
    return {
      element: firstRow,
      renderedRowIndex,
    };
  },

  /**
   * Get nth file row element that was rendered
   * @param {Number} index
   * @returns {HTMLElement|null}
   */
  getNthRenderedRow(index) {
    return $(this.get('element')).find('[data-row-id]')[index] || null;
  },

  /**
   * @param {string} type one of: prev, next
   * @param {string} state one of: started, resolved, rejected
   * @returns {undefined}
   */
  onFetchingStateUpdate(type, state) {
    safeExec(
      this,
      'set',
      camelize(`fetching-${type}`),
      state === 'started'
    );
  },

  /**
   * @param {string} parentDirEntityId
   * @param {FbTableRefreshOptions} options
   * @returns {Promise}
   */
  async onDirChildrenRefresh(parentDirEntityId, options) {
    if (get(this.dir, 'entityId') === parentDirEntityId) {
      return this.refresh(options.animated, options.forced);
    }
  },

  /**
   * Refreshes current view of file table - effectively refreshing current files list
   * view with optional loading indicator.
   * This method is a part of File Browser Table API implemenetation.
   * @param {boolean} [animated]
   * @param {boolean} [forced]
   * @returns {Promise}
   */
  async refresh(animated = true, forced = false) {
    // should be the same as $refresh-transition-duration in fb-table.scss
    const fadeTime = 300;
    if (this.refreshDefer) {
      if (forced) {
        await this.refreshDefer.promise;
        return this.refresh(animated, forced);
      } else {
        return await this.refreshDefer.promise;
      }
    }
    this.browserModel.onTableWillRefresh();
    if (!animated) {
      return await this.refreshFileList(forced);
    }
    this.set('renderRefreshSpinner', true);
    // wait for refresh spinner to render because it needs parent class to transition
    await waitForRender();
    safeExec(this, 'set', 'refreshDefer', defer());
    try {
      await sleep(fadeTime);
      return await this.refreshFileList(forced);
    } finally {
      safeExec(this, () => {
        this.refreshDefer.resolve();
        this.set('refreshDefer', null);
        later(() => {
          if (!this.refreshDefer) {
            safeExec(this, 'set', 'renderRefreshSpinner', false);
          }
        }, fadeTime);
      });
    }
  },

  /**
   * Reloads data needed to display current list view.
   * Takes care of valid state of items array after reload and selected items.
   * This method is used internally - please use `refresh` to invoke items table refresh
   * from outside this component.
   * @param {boolean} forced If set to true - queue reload even if there is reload already
   *   in the processing queue.
   * @return {Promise}
   */
  async refreshFileList(forced = false) {
    const {
      dir,
      filesArray,
      viewTester,
      containerScrollTop,
      element,
    } = this.getProperties(
      'dir',
      'filesArray',
      'viewTester',
      'containerScrollTop',
      'element',
    );
    const $element = $(element);
    const visibleLengthBeforeReload = $element.find('.data-row').toArray()
      .filter(row => viewTester.isInView(row)).length;

    const promises = [];
    if (dir && dir.reload) {
      promises.push(dir.reload());
    }
    const filesArrayReload = filesArray.scheduleReload(forced ? { forced: true } : {})
      .finally(async () => {
        const {
          selectedItems,
          changeSelectedItems,
        } = this.getProperties('selectedItems', 'changeSelectedItems');
        const sourceArray = get(filesArray, 'sourceArray');
        // care about selection change only if there are some items selected that are not
        // current dir
        if (
          !isEmpty(selectedItems) &&
          !this.browserModel.isOnlyCurrentDirSelected
        ) {
          const updatedSelectedItems = selectedItems.filter(selectedFile =>
            sourceArray.includes(selectedFile)
          );
          // refresh may result in loss of some previously selected item, so only check
          // length - checking content of array is unnecessary
          if (selectedItems.length != updatedSelectedItems.length) {
            changeSelectedItems(updatedSelectedItems);
          }
        }

        await waitForRender();
        if (this.isDestroyed) {
          return;
        }

        const dataRows = this.element.querySelectorAll('.data-row');
        const anyRowVisible = Array.from(dataRows).some(row => viewTester.isInView(row));

        if (!anyRowVisible) {
          const fullLengthAfterReload = get(sourceArray, 'length');
          setProperties(filesArray, {
            startIndex: Math.max(
              0,
              fullLengthAfterReload - Math.max(3, visibleLengthBeforeReload - 10)
            ),
            endIndex: fullLengthAfterReload || 50,
          });
          next(() => {
            const firstRenderedRow = this.element
              .querySelector('.data-row[data-row-id]');
            if (firstRenderedRow) {
              firstRenderedRow.scrollIntoView();
            } else {
              containerScrollTop(0);
            }
          });
        }
      });
    promises.push(filesArrayReload);
    const browserModelRefreshPromise = this.browserModel.onListRefresh?.();
    if (browserModelRefreshPromise) {
      promises.push(browserModelRefreshPromise);
    }
    return await allFulfilled(promises);
  },

  // TODO: VFS-10743 Currently not used, but this method may be helpful in not-known
  // items select implementation
  /**
   * Returns subset of provided items that are available in current dir.
   * Can be used when there are selected items, but list is refreshed and we want to check
   * if these items are still available in the current dir.
   * @param {Array<any>} items Browsable items, eg. files.
   * @returns {Array<any>}
   */
  async filterCurrentDirAvailableItems(items = []) {
    const itemsToCheck = items.filter(item =>
      !this.filesArray.sourceArray.includes(item)
    );
    if (_.isEmpty(itemsToCheck)) {
      return items;
    }

    const dirId = this.get('dir.entityId');
    if (!dirId) {
      return _.difference(items, itemsToCheck);
    }
    /** @type {Array[any, PromiseState<boolean>]} */
    const existenceCheckArray = _.zip(
      itemsToCheck,
      await allSettled(itemsToCheck.map(item =>
        this.browserModel.checkItemExistsInParent(dirId, item)
      ))
    );
    const nonExistingItems = existenceCheckArray
      .filter(([item, { state, value: isAvailable }]) =>
        state === 'rejected' || !isAvailable || !item
      )
      .map(([item]) => item);

    return _.difference(items, nonExistingItems);
  },

  onTableScroll(items, headerVisible) {
    if (this.get('ignoreNextScroll')) {
      this.set('ignoreNextScroll', false);
      return;
    }

    const filesArray = this.get('filesArray');
    const sourceArray = get(filesArray, 'sourceArray');
    const filesArrayIds = sourceArray.mapBy('entityId');

    if (items[0] && !items[0].getAttribute('data-row-id')) {
      const listWatcher = this.get('listWatcher');
      next(() => {
        filesArray.scheduleTask('fetchPrev').then(result => {
          if (result !== false) {
            // wait for fetched prev render if something more loaded
            next(() => listWatcher?.scrollHandler());
          }
        });
      });
    }

    const firstNonEmptyRow = items.find(elem => elem.getAttribute('data-row-id'));
    const firstId =
      firstNonEmptyRow && firstNonEmptyRow.getAttribute('data-row-id') || null;
    const lastId = items[items.length - 1] &&
      items[items.length - 1].getAttribute('data-row-id') || null;
    let startIndex;
    let endIndex;
    if (firstId === null && get(sourceArray, 'length') !== 0) {
      const firstRow = this.element?.querySelector('.first-row');
      const firstRowTop = firstRow ? dom.offset(firstRow).top : 0;
      const blankStart = firstRowTop * -1;
      const blankEnd = blankStart + globals.window.innerHeight;
      startIndex = firstRowTop < 0 ? Math.floor(blankStart / this.rowHeight) : 0;
      endIndex = Math.floor(blankEnd / this.rowHeight);
      if (endIndex < 0) {
        endIndex = 50;
      }
    } else {
      startIndex = filesArrayIds.indexOf(firstId);
      endIndex = filesArrayIds.indexOf(lastId, startIndex);
    }
    if (startIndex <= endIndex) {
      const {
        startIndex: oldStartIndex,
        endIndex: oldEndIndex,
      } = getProperties(filesArray, 'startIndex', 'endIndex');
      if (oldStartIndex !== startIndex || oldEndIndex !== endIndex) {
        setProperties(filesArray, { startIndex, endIndex });
      }
    } else {
      console.error(
        'fb-table: tried to set endIndex lower than startIndex, which is illegal:',
        startIndex,
        endIndex
      );
    }
    safeExec(this, 'set', 'headerVisible', headerVisible);
  },

  clearFilesSelection() {
    return this.get('changeSelectedItems')([]);
  },

  /**
   * Do something if user clicks on a file. Consider modifier keys
   * @param {object} file
   * @param {boolean} ctrlKey
   * @param {boolean} shiftKey
   * @returns {undefined}
   */
  fileClicked(file, ctrlKey, shiftKey) {
    // do not change selection if only clicking to close context menu
    if (isPopoverOpened() || this.isItemDisabled(file)) {
      return;
    }

    const {
      selectedItems,
      singleSelect,
    } = this.getProperties('selectedItems', 'singleSelect');
    const selectedCount = get(selectedItems, 'length');
    const fileIsSelected = selectedItems.includes(file);
    const otherFilesSelected = selectedCount > (fileIsSelected ? 1 : 0);
    if (singleSelect) {
      if (fileIsSelected) {
        this.selectRemoveSingleFile(file);
      } else {
        this.selectOnlySingleFile(file);
      }
    } else {
      if (otherFilesSelected) {
        if (fileIsSelected) {
          if (ctrlKey) {
            this.selectRemoveSingleFile(file);
          } else if (shiftKey) {
            this.deselectBelowList(file);
          } else {
            this.selectOnlySingleFile(file);
          }
        } else {
          if (ctrlKey) {
            this.selectAddSingleFile(file);
          } else {
            if (shiftKey) {
              this.selectRangeToFile(file);
            } else {
              this.selectOnlySingleFile(file);
            }
          }
        }
      } else {
        if (fileIsSelected) {
          this.selectRemoveSingleFile(file);
        } else {
          this.selectAddSingleFile(file);
        }
      }
    }
  },

  addToSelectedItems(newFiles) {
    const {
      selectedItems,
      changeSelectedItems,
    } = this.getProperties('selectedItems', 'changeSelectedItems');
    const filesWithoutBroken = _.difference(
      newFiles.filter(f => get(f, 'type') !== 'broken'),
      selectedItems
    );
    const newSelectedItems = [...selectedItems, ...filesWithoutBroken];

    return changeSelectedItems(newSelectedItems);
  },

  async selectRemoveSingleFile(file) {
    const {
      selectedItems,
      changeSelectedItems,
    } = this.getProperties('selectedItems', 'changeSelectedItems');
    await changeSelectedItems(selectedItems.without(file));
    this.set('lastSelectedFile', null);
  },

  selectRemoveFiles(files) {
    const {
      selectedItems,
      changeSelectedItems,
    } = this.getProperties('selectedItems', 'changeSelectedItems');
    return changeSelectedItems(_.difference(selectedItems, files));
  },

  async selectAddSingleFile(file) {
    await this.addToSelectedItems([file]);
    this.set('lastSelectedFile', file);
  },

  async selectOnlySingleFile(file) {
    await this.get('changeSelectedItems')([file]);
    this.set('lastSelectedFile', file);
  },

  /**
   * Select files range using shift.
   * Use nearest selected file as range start.
   * @param {File} file
   * @returns {undefined}
   */
  selectRangeToFile(file) {
    const {
      filesArray,
      lastSelectedFile,
    } = this.getProperties(
      'filesArray',
      'lastSelectedFile'
    );

    const sourceArray = get(filesArray, 'sourceArray');

    const fileIndex = sourceArray.indexOf(file);

    let startIndex;
    if (lastSelectedFile) {
      startIndex = sourceArray.indexOf(lastSelectedFile);
    } else {
      startIndex = this.findNearestSelectedIndex(fileIndex);
    }

    const indexA = Math.min(startIndex, fileIndex);
    const indexB = Math.max(startIndex, fileIndex);
    this.addToSelectedItems(sourceArray.slice(indexA, indexB + 1));
  },

  deselectBelowList(file) {
    const filesArray = this.get('filesArray');
    const selectedItems = this.get('selectedItems');
    const sourceArray = get(filesArray, 'sourceArray');
    const fileIndex = sourceArray.indexOf(file);
    const selectedItemsSet = new Set(selectedItems);

    const belowSelectedItems = [];
    let nextFileIndex = fileIndex + 1;
    let nextFile = sourceArray.objectAt(nextFileIndex);
    while (nextFile && selectedItemsSet.has(nextFile)) {
      belowSelectedItems.push(nextFile);
      nextFileIndex += 1;
      nextFile = sourceArray.objectAt(nextFileIndex);
    }

    this.set('lastSelectedFile', file);
    this.selectRemoveFiles(belowSelectedItems);
  },

  findNearestSelectedIndex(fileIndex) {
    const {
      visibleFiles,
      selectedItems,
    } = this.getProperties(
      'visibleFiles',
      'selectedItems'
    );

    // Array<[index: Number, distanceFromFile: Number]>
    const selectedItemsIndices = selectedItems.map(sf => {
      const index = visibleFiles.indexOf(sf);
      return [index, Math.abs(index - fileIndex)];
    });
    const nearest = selectedItemsIndices.reduce((prev, current) => {
      return current[1] < prev[1] ? current : prev;
    }, [-1, Infinity]);
    let [nearestIndex, nearestDist] = nearest;
    if (nearestDist === Infinity) {
      nearestIndex = fileIndex;
    }
    return nearestIndex;
  },

  isItemDisabled(item) {
    return this.get('isItemDisabledFunction')(item) || false;
  },

  actions: {
    openContextMenu(file, mouseEvent) {
      if (isPopoverOpened() || this.isItemDisabled(file)) {
        return;
      }
      const {
        selectedItems,
        element,
      } = this.getProperties('selectedItems', 'element');
      if (get(selectedItems, 'length') === 0 || !selectedItems.includes(file)) {
        this.selectOnlySingleFile(file);
      }
      let left;
      let top;
      const trigger = mouseEvent.currentTarget;
      if (trigger.matches('.one-menu-toggle')) {
        const middleDot = trigger.querySelectorAll('.icon-dot')[1];
        const middleDotOffset = dom.offset(middleDot);
        left = middleDotOffset.left + 1;
        top = middleDotOffset.top + 1;
      } else {
        left = mouseEvent.clientX;
        top = mouseEvent.clientY;
      }
      const tableOffset = dom.offset(element);
      left = left - tableOffset.left;
      top = top - tableOffset.top;
      dom.setStyles(element?.querySelector('.file-actions-trigger'), {
        top: `${top}px`,
        left: `${left}px`,
      });
      // opening popover in after rendering trigger position change prevents from bad
      // placement
      scheduleOnce('afterRender', () => {
        // cause popover refresh
        if (this.get('fileActionsOpen')) {
          this.set('contextMenuRepositionTime', new Date().getTime());
          this.get('contextMenuApi').reposition();
        }
        this.actions.toggleFileActions.bind(this)(true, file);
      });
    },

    toggleFileActions(open, file) {
      this.set('fileActionsOpen', open, file);
    },

    /**
     * @param {object} file
     * @param {MouseEvent} clickEvent
     * @returns {any} result of this.fileClicked
     */
    fileClicked(file, clickEvent) {
      const { ctrlKey, metaKey, shiftKey } = clickEvent;
      return this.fileClicked(
        file,
        ctrlKey || metaKey,
        shiftKey
      );
    },

    /**
     * @param {object} file
     * @param {TouchEvent} touchEvent
     * @returns {any}
     */
    fileTouchHeld(file /*, touchEvent */ ) {
      return this.fileClicked(file, true, false);
    },

    /**
     * @param {object} file
     * @returns {any}
     */
    fileTapped(file) {
      const areSomeFilesSelected = Boolean(this.get('selectedItems.length'));
      if (areSomeFilesSelected) {
        return this.fileClicked(file, true, false);
      } else {
        return this.get('openFile')(file, { tapped: true });
      }
    },

    fileDoubleClicked(file /*, clickEvent */ ) {
      return this.get('openFile')(file);
    },
  },
});
