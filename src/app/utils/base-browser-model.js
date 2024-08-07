/**
 * A base class for logic and co-related data for file-browser.
 * It acts as a strategy for `file-browser` component, while the component serves
 * state (see region file-browser state) and API (region file-browser API).
 *
 * Extend this class to implement specific browsers like filesystem-browser.
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, {
  getProperties,
  computed,
  get,
  defineProperty,
} from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { dasherize } from '@ember/string';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import I18n from 'onedata-gui-common/mixins/i18n';
import animateCss from 'onedata-gui-common/utils/animate-css';
import {
  actionContext,
} from 'oneprovider-gui/components/file-browser';
import { typeOf, isEmpty } from '@ember/utils';
import BrowserListPoller from 'oneprovider-gui/utils/browser-list-poller';
import { tag, raw, conditional, eq, and, promise, bool, or } from 'ember-awesome-macros';
import moment from 'moment';
import _ from 'lodash';
import isPosixError from 'oneprovider-gui/utils/is-posix-error';
import createRenderThrottledProperty from 'onedata-gui-common/utils/create-render-throttled-property';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { syncObserver, asyncObserver } from 'onedata-gui-common/utils/observer';
import {
  destroyDestroyableComputedValues,
  destroyableComputed,
  initDestroyableCache,
} from 'onedata-gui-common/utils/destroyable-computed';
import ReplacingChunksArray from 'onedata-gui-common/utils/replacing-chunks-array';
import { A } from '@ember/array';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';

/**
 * @typedef {'pending'|'fulfilled'|'rejected'} BrowserListLoadState
 */

const BrowserListLoadState = Object.freeze({
  Pending: 'pending',
  Fulfilled: 'fulfilled',
  Rejected: 'rejected',
});

const mixins = [
  OwnerInjector,
  I18n,
];

export default EmberObject.extend(...mixins, {
  i18n: service(),
  errorExtractor: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.baseBrowserModel',

  //#region API for file-browser component

  /**
   * @virtual
   * @type {Components.FileBrowser}
   */
  browserInstance: undefined,

  /**
   * Proxy resolving currently browsed "directory" (directory for files, parent dataset,
   * etc.).
   * @virtual
   * @type {PromiseObject<any>}
   */
  dirProxy: undefined,

  /**
   * @virtual
   * @type {Array<String>}
   */
  buttonNames: Object.freeze([]),

  /**
   * @virtual
   * @type {(dirId: string, index: string, limit: number, offset: number) => Promise<{ childrenRecords: Array<any>, isLast: boolean }>}
   */
  fetchDirChildren: notImplementedReject,

  /**
   * @virtual
   * @type {Function}
   */
  onInsertElement: notImplementedIgnore,

  /**
   * @virtual
   * @type {Function}
   */
  onInsertHeaderElements: notImplementedIgnore,

  /**
   * @virtual
   * @type {Function<(fileIds: Array<String>) => Promise>}
   */
  onOpenFile: notImplementedIgnore,

  /**
   * Callback invoked parallely with list refresh methods (eg. reloading children list)
   * when items list is refreshed.
   * Items table will wait until it is resolved before ending refresh procedure.
   * @virtual
   * @type {() => Promise}
   */
  onListRefresh: notImplementedIgnore,

  /**
   * Return true for item that should be presented as disabled (muted, non-selectable).
   * @virtual optional
   * @type {(item: Object) => boolean}
   */
  isItemDisabled: notImplementedIgnore,

  /**
   * @virtual
   * @type {String}
   */
  rowComponentName: '',

  /**
   * @virtual
   * @type {String}
   */
  statusBarComponentName: '',

  /**
   * @virtual
   * @type {String}
   */
  headStatusBarComponentName: '',

  /**
   * @virtual
   * @type {String}
   */
  mobileSecondaryInfoComponentName: '',

  /**
   * @virtual
   * @type {String}
   */
  columnsComponentName: '',

  /**
   * @virtual
   * @type {String}
   */
  headRowComponentName: '',

  /**
   * @virtual
   * @type {String}
   */
  headFirstCellComponentName: '',

  /**
   * @virtual
   * @type {String}
   */
  headRowTranslation: '',

  /**
   * @virtual
   * @type {String}
   */
  headRowClass: '',

  /**
   * @virtual
   * @type {String}
   */
  firstColumnClass: '',

  /**
   * @virtual
   * @type {String}
   */
  dirLoadErrorComponentName: '',

  /**
   * @virtual
   * @type {String}
   */
  emptyDirComponentName: '',

  /**
   * @virtual
   * @type {() => Utils.ColumnsConfiguration}
   */
  createColumnsConfiguration: notImplementedThrow,

  /**
   * @virtual optional
   * @type {String}
   */
  browserClass: '',

  /**
   * Custom text for "current directory" for current dir menu.
   * @virtual optional
   * @type {SafeString}
   */
  currentDirTranslation: '',

  /**
   * CSS selector of element(s) which right click on SHOULD NOT cause opening current dir
   * context menu.
   * @type {string}
   */
  ignoreCurrentDirContextMenuSelector: '',

  /**
   * If true, files table will not jump to changed `itemsForJump` if these items are
   * already selected.
   * @virtual optional
   * @type {Boolean}
   */
  disableReJumps: false,

  /**
   * @virtual optional
   * @type {Boolean}
   * When true, allow to select only single item on list.
   */
  singleSelect: false,

  /**
   * Invoked right after the `dir` changes, so it is going to be rendered in the view.
   * It is a place suitable for doing newly opened dir handling.
   * @virtual optional
   * @type {(dir: Models.File) => Promise}
   */
  onDidChangeDir: undefined,

  /**
   * @type {Utils.ColumnsConfiguration}
   */
  columnsConfiguration: undefined,

  /**
   * @type {String}
   */
  rootIcon: 'space',

  /**
   * Item action invoked when flipped row icon is clicked
   * @virtual optional
   * @type { String }
   */
  infoIconActionName: undefined,

  /**
   * Injected property to notify about external selection change, that should enable jump.
   * @type {Array<Object>} Array of browsable objects (eg. File).
   */
  selectedItemsForJump: undefined,

  /**
   * Used by `browserListPoller` to enable/disable polling.
   * @type {boolean}
   */
  isListPollingEnabled: true,

  /**
   * @type {boolean}
   */
  isUsingUploadArea: false,

  getCurrentDirMenuButtons(availableActions) {
    return availableActions;
  },

  /**
   * All button objects. Order is significant.
   * Computed property is dynamically generated by `generateAllButtonsArray` observer.
   * @type {ComputedProperty<Array<Object>>}
   */
  allButtonsArray: undefined,

  /**
   * Maps button id => button object.
   * @type {Object}
   */
  allButtonsHash: computed('allButtonsArray.[]', function allButtonsHash() {
    const allButtonsArray = this.get('allButtonsArray');
    return allButtonsArray.reduce((hash, button) => {
      hash[get(button, 'id')] = button;
      return hash;
    }, {});
  }),

  //#endregion

  //#region file-browser state

  dirError: reads('browserInstance.dirError'),
  element: reads('browserInstance.element'),
  spacePrivileges: reads('browserInstance.spacePrivileges'),
  spaceId: reads('browserInstance.spaceId'),
  isSpaceOwned: reads('browserInstance.isSpaceOwned'),
  resolveFileParentFun: reads('browserInstance.resolveFileParentFun'),
  // TODO: VFS-7643 refactor generic-browser to use names other than "file" for leaves
  fileClipboardMode: reads('browserInstance.fileClipboardMode'),
  fileClipboardFiles: reads('browserInstance.fileClipboardFiles'),

  //#endregion

  //#region browser model configuration

  refreshBtnIsVisible: true,

  //#endregion

  //#region browser model state

  /**
   * @type {Utils.BrowserListPoller}
   */
  browserListPoller: null,

  /**
   * Time in milliseconds from Date.now.
   * @type {number}
   */
  lastRefreshTime: undefined,

  /**
   * Latest error object when list load fails.
   * If the recent list load succeeds - this should bet set to null.
   * @type {any}
   */
  listLoadError: undefined,

  //#endregion

  //#region file-browser API

  fbTableApi: reads('browserInstance.fbTableApi'),

  // TODO: VFS-7643 refactor generic-browser to use names other than "file" for leaves
  /**
   * You can push and remove file IDs to alter row icons loading state
   * @type {Ember.Array<String>}
   */
  loadingIconFileIds: reads('browserInstance.loadingIconFileIds'),

  //#endregion

  dirId: reads('dirProxy.content.entityId'),

  isRootDirProxy: promise.object(computed(
    'dirProxy.content.hasParent',
    'resolveFileParentFun',
    async function isRootDirProxy() {
      const dir = await this.dirProxy;
      if (!this.dir) {
        return;
      }
      return !(await this.resolveFileParentFun(dir));
    }
  )),

  isRootDir: bool('isRootDirProxy.content'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  areMultipleSelected: computed('selectionContext', function areMultipleSelected() {
    const selectionContext = this.get('selectionContext');
    return [
      actionContext.multiFile,
      actionContext.multiDir,
      actionContext.multiMixed,
      actionContext.multiFilePreview,
      actionContext.mutliDirPreview,
      actionContext.multiMixedPreview,
    ].includes(selectionContext);
  }),

  refreshBtnClass: computed(
    'browserListPoller.isPollingEnabled',
    function refreshBtnClass() {
      return (!this.browserListPoller?.isPollingEnabled) ?
        'refresh-indicator-warning' : '';
    }
  ),

  refreshBtnTip: computed(
    'selectedItemsOutOfScope',
    'anyDataLoadError',
    'browserListPoller.{pollInterval,isPollingEnabled}',
    'lastRefreshTime',
    function refreshBtnTip() {
      if (this.anyDataLoadError) {
        const errorText = this.errorExtractor
          .getMessage(this.anyDataLoadError)?.message ?? this.t('unknownError');
        return this.t('refreshTip.lastError', {
          errorText,
        });
      } else if (this.selectedItemsOutOfScope) {
        return this.t('refreshTip.selectedDisabled', {
          lastRefreshTime: this.createLastRefreshTimeText(),
        });
      } else if (!this.browserListPoller?.isPollingEnabled) {
        return this.t('refreshTip.unknownDisabled');
      } else {
        const pollingIntervalSecs =
          Math.floor(this.browserListPoller?.pollInterval / 1000);
        return this.t('refreshTip.enabled', {
          pollingIntervalSecs: pollingIntervalSecs,
        });
      }
    }
  ),

  btnRefresh: computed(function btnRefresh() {
    return this.createItemBrowserAction(EmberObject.extend({
      id: 'refresh',
      title: this.t('fileActions.refresh'),
      disabled: false,
      icon: 'refresh',
      action: () => {
        return this.refresh();
      },
      class: tag`file-action-refresh ${'browserModelBtnClass'}`,
      tip: undefined,
      browserModelBtnClass: undefined,

      showIn: conditional(
        'context.refreshBtnIsVisible',
        raw([
          actionContext.inDir,
          actionContext.inDirPreview,
          actionContext.currentDir,
          actionContext.currentDirPreview,
          actionContext.rootDir,
          actionContext.rootDirPreview,
        ]),
        raw([]),
      ),

      init() {
        this._super(...arguments);
        createRenderThrottledProperty(
          this,
          'context.refreshBtnTip',
          'tip'
        );
        createRenderThrottledProperty(
          this,
          'context.refreshBtnClass',
          'browserModelBtnClass'
        );
      },
    }));
  }),

  /**
   * State of items listing. It is pending only when list is initially loaded.
   * Refreshing can cause change state to fulfilled and rejected - it does not set
   * state to pending when refresh is pending.
   *
   * - On initial load: pending -> fulfilled / rejected.
   * - When is fulfilled and refreshing changes state to fulfilled: fulfilled.
   * - When is rejected and refreshing changes state to rejected: rejected.
   * @type {ComputedProperty<{ state: BrowserListLoadState, reason: any }>}
   */
  listLoadState: computed(
    'dirProxy.{isFulfilled,isRejected}',
    'itemsArray.initialLoad.{isFulfilled,isRejected}',
    'listLoadError',
    function listLoadState() {
      // listLoadState is used from the init, but we do not want to trigger creating
      // itemsArray at this point, so use it only if something else created the itemsArray
      // before
      const dirProxy = this.dirProxy;
      const initialLoad = this.cacheFor('itemsArray')?.initialLoad;

      if (this.listLoadError) {
        return {
          state: BrowserListLoadState.Rejected,
          reason: this.listLoadError,
        };
      } else if (dirProxy?.isFulfilled) {
        if (!initialLoad || initialLoad.isPending) {
          return {
            state: BrowserListLoadState.Pending,
            reason: undefined,
          };
        } else if (initialLoad.isFulfilled) {
          return {
            state: BrowserListLoadState.Fulfilled,
            reason: undefined,
          };
        } else {
          return {
            state: BrowserListLoadState.Rejected,
            reason: initialLoad.reason,
          };
        }
      } else if (dirProxy?.isRejected) {
        return {
          state: BrowserListLoadState.Rejected,
          reason: dirProxy.reason,
        };
      } else {
        return {
          state: BrowserListLoadState.Pending,
          reason: undefined,
        };
      }
    }
  ),

  lastResolvedDir: computedLastProxyContent('dirProxy', { nullOnReject: true }),

  /**
   * A last list refresh error is considered be "fatal" when it is unlikely that it will
   * disappear on list refresh, so instead of informing user about refresh error using
   * notify, the view should display error view in place of the list.
   * @type {ComputedProperty<boolean>}
   */
  isLastListLoadErrorFatal: computed(
    'listLoadError',
    function isLastListLoadErrorFatal() {
      const error = this.lListLoadError;
      return error && (
        error.id === 'internalServerError' ||
        isPosixError(error, 'enoent') ||
        isPosixError(error, 'eacces')
      );
    }
  ),

  /**
   * If this error is not empty, then items listing should not be rendered.
   * Instead error information should be shown.
   * @type {ComputedProperty<Object>}
   */
  dirViewLoadError: computed(
    'isLastListLoadErrorFatal',
    'listLoadError',
    'dirError',
    'listLoadState.{state,reason}',
    function dirViewLoadError() {
      if (this.isLastListLoadErrorFatal) {
        return this.listLoadError;
      }
      if (this.dirError) {
        return this.dirError;
      }
      if (
        // TODO: VFS-12214 non-fatal errors should not be displayed instead of file list
        // the code below is experimental to be tested using acceptance tests
        // !this.listLoadError &&
        // !this.dirError &&
        this.listLoadState.state === BrowserListLoadState.Rejected
      ) {
        return this.listLoadState.reason ?? { id: 'unknown' };
      }
    }
  ),

  /**
   * A last error that occurred when item data has tried to be loaded:
   * - loading and refreshing dir info
   * - loading and refreshing item list
   * @type {ComputedProperty<Object>}
   */
  anyDataLoadError: or('dirViewLoadError', 'listLoadError'),

  isOnlyCurrentDirSelected: and(
    eq('selectedItems.length', raw(1)),
    eq('selectedItems.0', 'dirProxy.content'),
  ),

  isOnlyRootDirSelected: and(
    'isOnlyCurrentDirSelected',
    'isRootDir',
  ),

  /**
   * True if there are selected items that surely be gone from the replacing chunks array
   * visible window after refresh. This state can be used to show warning for refreshing
   * the list, which will cause some selected items to be deselected and to disable
   * auto-refresh.
   */
  selectedItemsOutOfScope: computed(
    'itemsArray.[]',
    'selectedItems.[]',
    'dir',
    function selectedItemsOutOfScope() {
      if (!this.dir) {
        return false;
      }
      const selectedItems = this.selectedItems;
      if (
        !selectedItems?.length ||
        selectedItems.length === 1 && selectedItems[0] === this.dir
      ) {
        return false;
      }
      const itemsArray = this.get('itemsArray');
      if (!itemsArray) {
        return [];
      }
      return selectedItems.some(item => !itemsArray.includes(item));
    }
  ),

  dir: reads('dirProxy.content'),

  itemsArray: destroyableComputed('dir', function itemsArray() {
    if (!this.dir) {
      return;
    }
    return this.createItemsArray();
  }),

  /**
   * One of values from `actionContext` enum object marked as "selection context" in doc
   * @type {ComputedProperty<string>}
   */
  selectionContext: computed(
    'selectedItems.[]',
    'previewMode',
    function selectionContext() {
      const {
        selectedItems,
        previewMode,
      } = this.getProperties('selectedItems', 'previewMode');
      if (selectedItems) {
        const count = get(selectedItems, 'length');
        if (count === 0) {
          return 'none';
        }
        let context;
        if (count === 1) {
          if (get(selectedItems[0], 'type') === 'dir') {
            context = actionContext.singleDir;
          } else {
            context = actionContext.singleFile;
          }
        } else {
          if (selectedItems.isAny('type', 'dir')) {
            if (selectedItems.isAny('type', 'file')) {
              context = actionContext.multiMixed;
            } else {
              context = actionContext.multiDir;
            }
          } else {
            context = actionContext.multiFile;
          }
        }
        return previewMode ? this.previewizeContext(context) : context;
      }
    }
  ),

  /**
   * Sync: defines a property.
   */
  generateAllButtonsArray: syncObserver(
    'buttonNames.[]',
    function generateAllButtonsArray() {
      const buttonNames = this.get('buttonNames');
      defineProperty(
        this,
        'allButtonsArray',
        computed(...buttonNames, function allButtonsArray() {
          return buttonNames.map(btnName => this.get(btnName));
        })
      );
      this.notifyPropertyChange('allButtonsArray');
    }
  ),

  columnsVisibilityAutoChecker: asyncObserver(
    'listLoadState.state',
    'dirLoadError',
    'hasEmptyDirClass',
    function columnsVisibilityAutoChecker() {
      this.columnsConfiguration?.checkColumnsVisibility();
    },
  ),

  /**
   * Sync observer: for some unknown reason, this observer does not fire if it is sync.
   * Maybe it will be fixed in future versions of Ember (tested on 3.16).
   *
   * TODO: VFS-12210 try to use asyncObserver here (when upgrading Ember to 3.20+)
   *
   * @type {Ember.Observer}
   */
  dirObserver: syncObserver('dir', function dirObserver() {
    if (this.dir) {
      this.onDidChangeDir?.(this.dir);
    }
  }),

  init() {
    initDestroyableCache(this);
    this._super(...arguments);
    this.setProperties({
      selectedItems: [],
      lastRefreshTime: Date.now(),
      columnsConfiguration: this.createColumnsConfiguration(),
    });
    this.generateAllButtonsArray();
    this.initBrowserListPoller();
  },

  /**
   * @override
   */
  willDestroy() {
    try {
      destroyDestroyableComputedValues(this);
      this.browserListPoller?.destroy();
      this.cacheFor('btnRefresh')?.destroy();
    } finally {
      this._super(...arguments);
    }
  },

  previewizeContext(context) {
    return `${context}Preview`;
  },

  /**
   *
   * @param {Components.FileBrowser} browserInstance
   */
  bindBrowserInstance(browserInstance) {
    this.set('browserInstance', browserInstance);
  },

  /**
   * @param {HTMLElement} element HTMLElement of Components.FileBrowser.
   */
  mount(element) {
    const elementFbTableThead = element.querySelector('.fb-table-thead');
    if (elementFbTableThead) {
      this.columnsConfiguration?.mount(elementFbTableThead);
    } else {
      console.warn(
        'Could not find file browser table head element - columns configuration will not work properly.'
      );
    }
  },

  createItemsArray() {
    const dirId = this.dirId;
    let initialJumpIndex;
    if (!isEmpty(this.selectedItemsForJump)) {
      const firstSelectedForJump = A(this.selectedItemsForJump)
        .sortBy('index')
        .objectAt(0);
      initialJumpIndex = get(firstSelectedForJump, 'index');
    }
    const array = ReplacingChunksArray.create({
      fetch: async (...fetchArgs) => {
        const {
          childrenRecords,
          isLast,
        } = await this.fetchDirChildren(dirId, ...fetchArgs);
        return { array: childrenRecords, isLast };
      },
      startIndex: 0,
      endIndex: 50,
      indexMargin: 10,
      initialJumpIndex,
    });

    array.on(
      'fetchPrevStarted',
      () => this.fbTableApi?.onFetchingStateUpdate('prev', 'started')
    );
    array.on(
      'fetchPrevResolved',
      () => this.fbTableApi?.onFetchingStateUpdate('prev', 'resolved')
    );
    array.on(
      'fetchPrevRejected',
      () => this.fbTableApi?.onFetchingStateUpdate('prev', 'rejected')
    );
    array.on(
      'fetchNextStarted',
      () => this.fbTableApi?.onFetchingStateUpdate('next', 'started')
    );
    array.on(
      'fetchNextResolved',
      () => this.fbTableApi?.onFetchingStateUpdate('next', 'resolved')
    );
    array.on(
      'fetchNextRejected',
      () => this.fbTableApi?.onFetchingStateUpdate('next', 'rejected')
    );
    array.on(
      'willChangeArrayBeginning',
      async ({ updatePromise, newItemsCount }) => {
        await updatePromise;
        safeExec(this, () => {
          this.fbTableApi?.adjustScroll(newItemsCount);
        });
      }
    );
    array.on(
      'willResetArray',
      async ({ updatePromise }) => {
        await updatePromise;
        safeExec(this, () => {
          this.fbTableApi?.scrollTopAfterFrameRender();
        });
      }
    );
    return array;
  },

  changeDir(dir) {
    return this.browserInstance.changeDir(dir);
  },

  navigateToRoot() {
    return this.browserInstance.updateDirEntityId(null);
  },

  // TODO: VFS-10743 Currently not used, but this method may be helpful in not-known
  // items select implementation
  /**
   * Dummy implementation virtual method.
   * Should be implemented to asynchronically check if an item (eg. file) exists in parent
   * container (in this example - directory). If so, it should resolve true;
   * @param {string} parentId Entity ID of browsable parent of item, eg. directory.
   * @param {any} item A browsable item, eg. file.
   * @returns {Promise<boolean>}
   */
  async checkItemExistsInParent( /* parentId, item */ ) {
    return false;
  },

  initBrowserListPoller() {
    if (this.browserListPoller) {
      this.browserListPoller.destroy();
    }
    this.set('browserListPoller', this.createBrowserListPoller());
  },

  createBrowserListPoller() {
    return BrowserListPoller.create({
      browserModel: this,
    });
  },

  /**
   * @param {Object} dir file-like object
   * @param {Function} updateBrowserDir A standard procedure of file
   *   browser that must be invoked to really change the dir in browser.
   *   If you want to stop opening dir in real browser, do not invoke this callback.
   *   The first argument if dir to be effectively opened - if you invoke the function
   *   without arguments it will open `dir` by default.
   * @returns {Promise<void>}
   */
  async onWillChangeDir(dir, updateBrowserDir) {
    return await updateBrowserDir?.(dir);
  },

  /**
   * Items table (fb-table component) refresh can be invoked from anywhere using
   * FbTableApi. This method will be invoked right before refresh start, including
   * optional reloading indicator animation.
   */
  onTableWillRefresh() {
    this.set('lastRefreshTime', Date.now());

    // If table is going to refresh and the poller is polling now, it is likely
    // that the refresh has been invoked by the poller, so don't restart interval.
    // Otherwise, the refresh was caused by user or by some event (eg. uploading a file),
    // so next auto-refresh should be postponed to prevent too much refreshes.
    if (this.browserListPoller && !this.browserListPoller.isPollingNow) {
      this.browserListPoller.restartInterval();
    }
  },

  /**
   * Refreshes current items view by reloading current list view data.
   * @param {Object} options
   * @param {boolean} options.silent If true, there will be no animation on action button,
   *   no reloading indicators and errors will not be presented in GUI.
   * @returns {Promise} Resolves when items list is refreshed.
   */
  async refresh({ silent = false } = {}) {
    const {
      globalNotify,
      fbTableApi,
      element,
    } = this;
    if (!silent) {
      animateCss(
        element.querySelector('.fb-toolbar-button.file-action-refresh'),
        'pulse-mint'
      );
    }
    try {
      const refreshResult = await fbTableApi.refresh(!silent);
      this.set('listLoadError', null);
      return refreshResult;
    } catch (error) {
      if (this.isDestroyed || this.isDestroying) {
        return;
      }
      this.set('listLoadError', error);

      // notification is not shown when the error is fatal, because then it is displayed
      // as content of browser
      if (!silent && !this.isLastListLoadErrorFatal) {
        let errorText = String(
          this.errorExtractor.getMessage(error)?.message ?? this.t('unknownError')
        );
        if (errorText?.endsWith('.')) {
          errorText = errorText.slice(0, errorText.length - 1);
        }
        errorText = _.lowerFirst(errorText);
        globalNotify.warning(this.t('refreshingFailed', {
          errorText,
        }));
      }

      throw error;
    }
  },

  changeSelectedItems(items) {
    this.set('selectedItems', items);
  },

  /**
   * @typedef {Object} BrowserItemActionSpec
   * @property {string} id the ID of action that is used to generate default values
   *   of properties, eg. icon name and title i18n key
   * @property {Function} action
   * @property {string} [icon] icon name; if not provided will be generated using `id`
   * @property {string} [title] action title in menu; if not provided will be generated
   *   using `id`
   * @property {boolean} [disabled]
   * @property {Array<Component.FileBrowser.ActionContext>} showIn
   * @property {string} [class]
   */

  /**
   * Create button or popover menu item for controlling files.
   * @param {BrowserItemActionSpec|EmberClass} fileActionSpec
   * @param {Object} options additional options for object create
   * @returns {EmberObject}
   */
  createItemBrowserAction(fileActionSpec, options = {}) {
    const specType = typeOf(fileActionSpec);
    switch (specType) {
      case 'object': {
        const {
          id,
          icon,
          title,
          disabled,
          class: elementClass,
          showIn,
          action,
        } = getProperties(
          fileActionSpec,
          'id',
          'icon',
          'title',
          'disabled',
          'class',
          'showIn',
          'action',
        );
        return Object.assign({}, fileActionSpec, {
          icon: icon || `browser-${dasherize(id)}`,
          title: title || this.t(`fileActions.${id}`),
          disabled: disabled === undefined ? false : disabled,
          class: `file-action-${id} ${elementClass || ''}`,
          showIn: showIn || [],
          action: (files, ...args) => {
            return action(files || this.get('selectedItems'), ...args);
          },
        }, options);
      }
      case 'class':
        return fileActionSpec.create({
          ownerSource: this,
          context: this,
        }, options);
      default:
        throw new Error(`createItemBrowserAction: not supported spec type: ${specType}`);
    }
  },

  createLastRefreshTimeText() {
    let lastRefreshTimeText;
    const nowMoment = moment.unix(Math.floor(Date.now() / 1000));
    const lastRefreshMoment = moment.unix(Math.floor(this.lastRefreshTime / 1000));
    const isToday =
      moment(lastRefreshMoment).startOf('day').toString() ===
      moment(nowMoment).startOf('day').toString();
    if (isToday) {
      lastRefreshTimeText = lastRefreshMoment.format('H:mm');
    } else {
      lastRefreshTimeText = lastRefreshMoment.format('D MMM');
    }
    return lastRefreshTimeText;
  },
});
