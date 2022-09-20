/**
 * A container with table of files (children of selected dir).
 * Supports infinite scroll.
 *
 * @module components/file-browser/fb-table
 * @author Jakub Liput
 * @copyright (C) 2019-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { get, computed, observer, setProperties, getProperties } from '@ember/object';
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
import { equal, and, not, or, raw, bool } from 'ember-awesome-macros';
import { resolve, all as allFulfilled } from 'rsvp';
import _ from 'lodash';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import ViewTester from 'onedata-gui-common/utils/view-tester';
import { A } from '@ember/array';
import { isEmpty } from '@ember/utils';
import sleep from 'onedata-gui-common/utils/sleep';
import animateCss from 'onedata-gui-common/utils/animate-css';

const defaultIsItemDisabled = () => false;

export default Component.extend(I18n, {
  classNames: ['fb-table'],
  classNameBindings: [
    'hasEmptyDirClass:empty-dir',
    'dirLoadError:error-dir',
    'specialViewClass:special-dir-view',
    'refreshStarted',
  ],
  attributeBindings: ['tabIndex'],

  fileManager: service(),
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbTable',

  /**
   * @virtual
   * @type {models/File}
   */
  dir: undefined,

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
   * @type {(api: { refresh: Function, getFilesArray: Function }) => undefined}
   */
  registerApi: notImplementedIgnore,

  /**
   * @virtual optional
   * @type {Function}
   */
  containerScrollTop: notImplementedIgnore,

  /**
   * @virtual optional
   * If defined replace `fetchDirChildren` with this function
   * @type {Function}
   */
  customFetchDirChildren: undefined,

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

  _window: window,

  /**
   * @type {HTMLElement}
   */
  _body: document.body,

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
    const $contentScroll = $(this.get('contentScroll'));
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
    const test = Object.entries(namesCount)
      .filter(([, count]) => count > 1)
      .map(([name]) => name);
    return test;
  }),

  // NOTE: not using reads as a workaround to bug in Ember 2.18
  initialLoad: computed('filesArray.initialLoad', function initialLoad() {
    return this.get('filesArray.initialLoad');
  }),

  /**
   * True if there is initially loaded file list, but it is empty.
   * False if there is initially loaded file list, but it is not empty or
   * the list was not yet loaded or cannot be loaded.
   * @type {boolean|undefined}
   */
  isDirEmpty: and('initialLoad.isFulfilled', not('filesArray.length')),

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
  showDirContextMenu: not('dirLoadError'),

  specialViewClass: or('hasEmptyDirClass', 'dirLoadError'),

  /**
   * @type {ComputedProperty<object>}
   */
  dirLoadError: computed(
    'initialLoad.{isRejected,reason}',
    function dirLoadError() {
      const initialLoad = this.get('initialLoad');
      if (get(initialLoad, 'isRejected')) {
        return get(initialLoad, 'reason');
      }
    }
  ),

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
      window.requestAnimationFrame(() => {
        safeExec(this, () => {
          this.get('containerScrollTop')(value, isDelta);
        });
      });
    });
  },

  firstRowStyle: computed('firstRowHeight', function firstRowStyle() {
    return htmlSafe(`height: ${this.get('firstRowHeight')}px;`);
  }),

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
   * Functions exposed by fb-table
   * @type {ComputedProperty<Object>}
   */
  api: computed(function api() {
    return {
      refresh: async (animated = true) => {
        const refreshStarted = this.get('refreshStarted');
        // should be the same as $refresh-transition-duration in fb-table.scss
        const fadeTime = 300;
        if (refreshStarted) {
          return;
        }
        if (!animated) {
          return this.refreshFileList();
        }
        this.set('renderRefreshSpinner', true);
        // wait for refresh spinner to render because it needs parent class to transition
        scheduleOnce('afterRender', async () => {
          safeExec(this, 'set', 'refreshStarted', true);
          try {
            await sleep(fadeTime);
            return await this.refreshFileList();
          } finally {
            safeExec(this, 'set', 'refreshStarted', false);
            later(() => {
              if (!this.get('refreshStarted')) {
                safeExec(this, 'set', 'renderRefreshSpinner', false);
              }
            }, fadeTime);
          }
        });
      },
      getFilesArray: () => {
        return this.get('filesArray');
      },
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
    };
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

  fetchDirChildren: computed('customFetchDirChildren', function fetchDirChildren() {
    const fetchFun = this.get('customFetchDirChildren') ||
      this._fetchDirChildren.bind(this);
    return async (entityId, ...args) => {
      const dir = this.get('dir');
      // it shows empty directory for a while
      if (get(dir, 'entityId') !== entityId) {
        // due to incomplete async implementation in fb-table, sometimes it can ask for
        // children of dir that is not currently opened
        return { childrenRecords: [], isLast: true };
      }
      const effEntityId = get(dir, 'effFile.entityId') || get(dir, 'entityId');
      return fetchFun(effEntityId, ...args);
    };
  }),

  apiObserver: observer('registerApi', 'api', function apiObserver() {
    const {
      registerApi,
      api,
    } = this.getProperties('registerApi', 'api');
    registerApi(api);
  }),

  /**
   * Change of a start or end index could be needed after source array length change
   */
  sourceArrayLengthObserver: observer(
    'filesArray.sourceArray.length',
    function sourceArrayLengthObserver() {
      scheduleOnce('afterRender', () => {
        const listWatcher = this.get('listWatcher');
        if (listWatcher) {
          listWatcher.scrollHandler();
        }
      });
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

  init() {
    this._super(...arguments);
    const {
      fileManager,
      registerApi,
      api,
      loadingIconFileIds,
      filesArray,
    } = this.getProperties(
      'fileManager',
      'registerApi',
      'api',
      'loadingIconFileIds',
      'filesArray'
    );
    if (!loadingIconFileIds) {
      this.set('loadingIconFileIds', A());
    }
    fileManager.registerRefreshHandler(this);
    registerApi(api);
    if (get(filesArray, 'initialJumpIndex')) {
      get(filesArray, 'initialLoad').then(() => {
        this.selectedItemsForJumpObserver();
      });
    }
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
  didInsertElement() {
    this._super(...arguments);
    const listWatcher = this.set('listWatcher', this.createListWatcher());
    listWatcher.scrollHandler();
  },

  /**
   * @override
   */
  willDestroyElement() {
    try {
      this.get('listWatcher').destroy();
      this.get('fileManager').deregisterRefreshHandler(this);
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
      listWatcher.scrollHandler();
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
    rowElements.forEach(rowElement => {
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

  onDirChildrenRefresh(parentDirEntityId) {
    if (this.get('dir.entityId') === parentDirEntityId) {
      return this.refreshFileList();
    } else {
      return resolve();
    }
  },

  async refreshFileList() {
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
    const filesArrayReload = filesArray.scheduleReload()
      .finally(() => {
        const {
          selectedItems,
          changeSelectedItems,
        } = this.getProperties('selectedItems', 'changeSelectedItems');
        const sourceArray = get(filesArray, 'sourceArray');
        const updatedSelectedItems = selectedItems.filter(selectedFile =>
          sourceArray.includes(selectedFile)
        );
        if (
          !isEmpty(selectedItems) &&
          // refresh may result in loss of some previously selected item, so only check
          // length - checking content of array is unnecessary
          selectedItems.length != updatedSelectedItems.length
        ) {
          changeSelectedItems(updatedSelectedItems);
        }

        scheduleOnce('afterRender', () => {
          if (this.get('isDestroyed')) {
            return;
          }

          const $dataRows = $(this.get('element')).find('.data-row');
          const anyRowVisible = $dataRows.toArray()
            .some(row => viewTester.isInView(row));

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
              const firstRenderedRow = document.querySelector('.data-row[data-row-id]');
              if (firstRenderedRow) {
                firstRenderedRow.scrollIntoView();
              } else {
                containerScrollTop(0);
              }
            });
          }
        });
      });
    promises.push(filesArrayReload);
    const browserModelRefreshPromise = this.browserModel.onListRefresh?.();
    if (browserModelRefreshPromise) {
      promises.push(browserModelRefreshPromise);
    }
    await allFulfilled(promises);
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
            next(() => listWatcher.scrollHandler());
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
      const {
        rowHeight,
        _window,
      } = this.getProperties('rowHeight', '_window');
      const $firstRow = $('.first-row');
      const firstRowTop = $firstRow.offset().top;
      const blankStart = firstRowTop * -1;
      const blankEnd = blankStart + _window.innerHeight;
      startIndex = firstRowTop < 0 ? Math.floor(blankStart / rowHeight) : 0;
      endIndex = Math.floor(blankEnd / rowHeight);
      if (endIndex < 0) {
        endIndex = 50;
      }
    } else {
      startIndex = filesArrayIds.indexOf(firstId);
      endIndex = filesArrayIds.indexOf(lastId, startIndex);
    }
    filesArray.setProperties({ startIndex, endIndex });
    safeExec(this, 'set', 'headerVisible', headerVisible);
  },

  createListWatcher() {
    const contentScroll = this.get('contentScroll');
    return new ListWatcher(
      $(contentScroll),
      '.data-row',
      (items, onTop) => safeExec(this, 'onTableScroll', items, onTop),
      '.table-start-row',
    );
  },

  // TODO: VFS-7643 this is specific to filesystem-browser - move to model after refactor
  _fetchDirChildren(dirId, ...fetchArgs) {
    const {
      fileManager,
      previewMode,
    } = this.getProperties('fileManager', 'previewMode');
    return fileManager
      .fetchDirChildren(dirId, previewMode ? 'public' : 'private', ...fetchArgs);
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
        const $middleDot = $(trigger).find('.icon-dot').eq(1);
        const middleDotOffset = $middleDot.offset();
        left = middleDotOffset.left + 1;
        top = middleDotOffset.top + 1;
      } else {
        left = mouseEvent.clientX;
        top = mouseEvent.clientY;
      }
      const $this = $(element);
      const tableOffset = $this.offset();
      left = left - tableOffset.left;
      top = top - tableOffset.top;
      $this.find('.file-actions-trigger').css({
        top,
        left,
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
