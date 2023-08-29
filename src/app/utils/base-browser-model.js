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
  observer,
  get,
  defineProperty,
  setProperties,
} from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { dasherize } from '@ember/string';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import animateCss from 'onedata-gui-common/utils/animate-css';
import {
  actionContext,
} from 'oneprovider-gui/components/file-browser';
import { typeOf } from '@ember/utils';
import BrowserListPoller from 'oneprovider-gui/utils/browser-list-poller';
import { tag, raw, conditional, eq, and, promise, bool, or } from 'ember-awesome-macros';
import moment from 'moment';
import _ from 'lodash';
import isPosixError from 'oneprovider-gui/utils/is-posix-error';
import createRenderThrottledProperty from 'onedata-gui-common/utils/create-render-throttled-property';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';

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
   * Used by `browserListPoller` to enable/disable polling.
   * @type {boolean}
   */
  isListPollingEnabled: true,

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

  dir: reads('browserInstance.dir'),
  dirError: reads('browserInstance.dirError'),
  itemsArray: reads('fbTableApi.itemsArray'),
  selectedItems: reads('browserInstance.selectedItems'),
  selectedItemsForJumpProxy: reads('browserInstance.selectedItemsForJumpProxy'),
  selectionContext: reads('browserInstance.selectionContext'),
  element: reads('browserInstance.element'),
  spacePrivileges: reads('browserInstance.spacePrivileges'),
  spaceId: reads('browserInstance.spaceId'),
  previewMode: reads('browserInstance.previewMode'),
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

  isRootDirProxy: promise.object(computed(
    'dir.hasParent',
    'resolveFileParentFun',
    async function isRootDirProxy() {
      if (!this.dir) {
        return;
      }
      return !(await this.resolveFileParentFun(this.dir));
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

  initialLoad: reads('itemsArray.initialLoad'),

  /**
   * State of items listing. It is pending only when list is initially loaded.
   * Refreshing can cause change state to fulfilled and rejected - it does not set
   * state to pending when refresh is pending.
   *
   * - On initial load: pending -> fulfilled / rejected.
   * - When is fulfilled and refreshing changes state to fulfilled: fulfilled.
   * - When is rejected and refreshing changes state to rejected: rejected.
   * @type {EmberObject}
   */
  listLoadState: computed('dir', () => {
    return EmberObject.create({
      state: BrowserListLoadState.Pending,
      reason: undefined,
    });
  }),

  listLoadError: conditional(
    eq('listLoadState.state', raw('rejected')),
    'listLoadState.reason',
    raw(undefined),
  ),

  /**
   * A last list refresh error is considered be "fatal" when it is unlikely that it will
   * disappear on list refresh, so instead of informing user about refresh error using
   * notify, the view should display error view in place of the list.
   * @type {ComputedProperty<boolean>}
   */
  isLastListLoadErrorFatal: computed(
    'listLoadError',
    function isLastListLoadErrorFatal() {
      const error = this.listLoadError;
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
      if (this.listLoadState.state === BrowserListLoadState.Rejected) {
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
    eq('selectedItems.0', 'dir'),
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
      const selectedItems = this.selectedItems;
      if (
        !selectedItems ||
        selectedItems.length === 1 && selectedItems[0] === this.dir
      ) {
        return false;
      }
      return selectedItems.some(item => !this.itemsArray?.includes(item));
    }
  ),

  generateAllButtonsArray: observer(
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

  listLoadStateSetter: observer(
    'initialLoad.{isPending,isSettled}',
    function listLoadStateSetter() {
      const initialLoad = this.initialLoad;
      if (!initialLoad) {
        return;
      }
      if (get(initialLoad, 'isPending')) {
        this.changeListLoadState(BrowserListLoadState.Pending);
      } else if (get(initialLoad, 'isRejected')) {
        this.changeListLoadState(
          BrowserListLoadState.Rejected,
          get(initialLoad, 'reason')
        );
      } else if (get(initialLoad, 'isFulfilled')) {
        this.changeListLoadState(BrowserListLoadState.Fulfilled);
      }
    }
  ),

  columnsVisibilityAutoChecker: observer(
    'listLoadState.state',
    'dirLoadError',
    'hasEmptyDirClass',
    function columnsVisibilityAutoChecker() {
      this.columnsConfiguration.checkColumnsVisibility();
    },
  ),

  init() {
    this._super(...arguments);
    this.set('lastRefreshTime', Date.now());

    this.listLoadStateSetter();
    this.generateAllButtonsArray();
    this.initBrowserListPoller();
    this.set('columnsConfiguration', this.createColumnsConfiguration());
  },

  /**
   * @override
   */
  willDestroy() {
    try {
      this.browserListPoller?.destroy();
    } finally {
      this._super(...arguments);
    }
  },

  changeDir(dir) {
    return this.browserInstance.changeDir(dir);
  },

  navigateToRoot() {
    return this.browserInstance.updateDirEntityId(null);
  },

  /**
   * @param {BrowserListLoadState} state
   * @param {any} [reason] Error reason only when state is rejected.
   */
  changeListLoadState(state, reason) {
    if (state === BrowserListLoadState.Rejected) {
      setProperties(this.listLoadState, {
        state,
        reason,
      });
    } else if (this.listLoadState.state !== state) {
      setProperties(this.listLoadState, {
        state,
        reason: undefined,
      });
    }
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
  async onChangeDir(dir, updateBrowserDir) {
    return await updateBrowserDir(dir);
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
    } = this.getProperties('globalNotify', 'fbTableApi', 'element');
    if (!silent) {
      animateCss(
        element.querySelector('.fb-toolbar-button.file-action-refresh'),
        'pulse-mint'
      );
    }
    try {
      const refreshResult = await fbTableApi.refresh(!silent);
      if (this.listLoadError) {
        this.changeListLoadState(BrowserListLoadState.Fulfilled);
      }
      return refreshResult;
    } catch (error) {
      if (this.isDestroyed || this.isDestroying) {
        return;
      }

      this.changeListLoadState(BrowserListLoadState.Rejected, error);

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
