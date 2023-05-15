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

import EmberObject, { getProperties, computed, observer, get, defineProperty } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { dasherize } from '@ember/string';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import animateCss from 'onedata-gui-common/utils/animate-css';
import {
  actionContext,
} from 'oneprovider-gui/components/file-browser';
import { typeOf } from '@ember/utils';
import BrowserListPoller from 'oneprovider-gui/utils/browser-list-poller';
import { scheduleOnce } from '@ember/runloop';
import { tag, raw, conditional, gt } from 'ember-awesome-macros';
import moment from 'moment';
import globals from 'onedata-gui-common/utils/globals';
import WindowResizeHandler from 'onedata-gui-common/mixins/window-resize-handler';
import { htmlSafe } from '@ember/string';
import dom from 'onedata-gui-common/utils/dom';

/**
 * Contains info about column visibility: if on screen is enough space to show this column
 * and if user want to view that
 * @typedef {EmberObject} columnProperties
 * @property {boolean} isVisible
 * @property {boolean} isEnabled
 * @property {number} width
 */

const mixins = [
  OwnerInjector,
  I18n,
  WindowResizeHandler,
];

export default EmberObject.extend(...mixins, {
  i18n: service(),

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
   * @type {Function}
   */
  onInsertElement: notImplementedIgnore,

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
   * @type {string}
   */
  browserPersistedConfigurationKey: '',

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
  itemsArray: reads('fbTableApi.itemsArray'),
  selectedItems: reads('browserInstance.selectedItems'),
  selectedItemsForJumpProxy: reads('browserInstance.selectedItemsForJumpProxy'),
  selectionContext: reads('browserInstance.selectionContext'),
  element: reads('browserInstance.element'),
  spacePrivileges: reads('browserInstance.spacePrivileges'),
  spaceId: reads('browserInstance.spaceId'),
  previewMode: reads('browserInstance.previewMode'),
  isSpaceOwned: reads('browserInstance.isSpaceOwned'),
  // TODO: VFS-7643 refactor generic-browser to use names other than "file" for leaves
  fileClipboardMode: reads('browserInstance.fileClipboardMode'),
  fileClipboardFiles: reads('browserInstance.fileClipboardFiles'),

  //#endregion

  //#region browser model configuration

  refreshBtnIsVisible: true,

  /**
   * @type {number}
   */
  defaultFileBrowserWidth: 1000,

  //#region

  //#region browser model state

  /**
   * @type {Utils.BrowserListPoller}
   */
  browserListPoller: null,

  /**
   * State of `selectedItemsOutOfScope` property that is updated only once for single
   * render to avoid "double render" errors. The value is controlled by an observer.
   * @type {boolean}
   */
  renderableSelectedItemsOutOfScope: false,

  /**
   * Time in milliseconds from Date.now.
   * @type {number}
   */
  lastRefreshTime: undefined,

  /**
   * @type {number}
   */
  firstColumnWidth: 400,

  /**
   * @type {number}
   */
  hiddenColumnsCount: 0,

  /**
   * @type {Object<string, columnProperties>}
   */
  columns: undefined,

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

  /**
   * @type {boolean}
   */
  isAnyColumnHidden: gt('hiddenColumnsCount', raw(0)),

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
    'renderableSelectedItemsOutOfScope',
    function refreshBtnClass() {
      return this.renderableSelectedItemsOutOfScope ?
        'refresh-selection-warning' : '';
    }
  ),

  refreshBtnTip: computed(
    'renderableSelectedItemsOutOfScope',
    'browserListPoller.pollInterval',
    'lastRefreshTime',
    function refreshBtnClass() {
      if (this.renderableSelectedItemsOutOfScope) {
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
        return this.t('refreshTip.selectedDisabled', {
          lastRefreshTime: lastRefreshTimeText,
        });
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
    return this.createFileAction(EmberObject.extend({
      id: 'refresh',
      title: this.t('fileActions.refresh'),
      disabled: false,
      icon: 'refresh',
      action: () => {
        return this.refresh();
      },

      tip: reads('context.refreshBtnTip'),
      class: tag`file-action-refresh ${'context.refreshBtnClass'}`,
      showIn: conditional(
        'context.refreshBtnIsVisible',
        raw([
          actionContext.inDir,
          actionContext.inDirPreview,
          actionContext.currentDir,
          actionContext.currentDirPreview,
          actionContext.spaceRootDir,
          actionContext.spaceRootDirPreview,
        ]),
        raw([]),
      ),
    }));
  }),

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

  /**
   * @type {Object}
   */
  columnsStyle: computed('columns', function columnsStyle() {
    const styles = {};
    for (const column in this.columns) {
      styles[column] = htmlSafe(`--column-width: ${this.columns[column].width}px;`);
    }
    return styles;
  }),

  /**
   * Controls value of `renderableSelectedItemsOutOfScope` to be synchronized with
   * `selectedItemsOutOfScope` most often once a render.
   */
  selectedItemsOutOfScopeObserver: observer(
    'selectedItemsOutOfScope',
    function selectedItemsOutOfScopeObserver() {
      scheduleOnce('afterRender', this.updateRenderableSelectedItemsOutOfScope);
    }
  ),

  /**
   * Create function that synchronizes value of `renderableSelectedItemsOutOfScope`
   * property. Needed because that value changes should be throttled.
   * @type {ComputedProperty<() => void>}
   */
  updateRenderableSelectedItemsOutOfScope: computed(
    function updateRenderableSelectedItemsOutOfScope() {
      return () => {
        this.set('renderableSelectedItemsOutOfScope', this.selectedItemsOutOfScope);
      };
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

  /**
   * @override
   */
  onWindowResize() {
    return this.checkColumnsVisibility();
  },

  init() {
    this._super(...arguments);
    this.generateAllButtonsArray();
    this.initBrowserListPoller();
    this.attachWindowResizeHandler();
    this.getEnabledColumnsFromLocalStorage();
    this.checkColumnsVisibility();

    this.set('lastRefreshTime', Date.now());

    // activate observers
    this.selectedItemsOutOfScope;
  },

  willDestroy() {
    this._super(...arguments);
    this.browserListPoller?.destroy();
    this.detachWindowResizeHandler();
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
      return fbTableApi.refresh(!silent);
    } catch (error) {
      if (!silent) {
        globalNotify.backendError(this.t('refreshing'), error);
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
  createFileAction(fileActionSpec, options = {}) {
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
    const specType = typeOf(fileActionSpec);
    switch (specType) {
      case 'object':
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
      case 'class':
        return fileActionSpec.create({
          ownerSource: this,
          context: this,
        }, options);
      default:
        throw new Error(`createFileAction: not supported spec type: ${specType}`);
    }
  },

  /**
   * @param {string} column
   * @param {boolean} isEnabled
   * @returns {void}
   */
  changeColumnVisibility(columnName, isEnabled) {
    this.set(`columns.${columnName}.isEnabled`, isEnabled);
    this.checkColumnsVisibility();
    const enabledColumns = [];
    for (const column in this.columns) {
      if (this.columns[column].isEnabled) {
        enabledColumns.push(column);
      }
    }
    globals.localStorage.setItem(
      `${this.browserPersistedConfigurationKey}.enabledColumns`,
      enabledColumns.join()
    );
  },

  checkColumnsVisibility() {
    let width = this.defaultFileBrowserWidth;
    const elementFbTableThead = this.element?.querySelector('.fb-table-thead');
    if (elementFbTableThead) {
      width = dom.width(elementFbTableThead);
    }
    let remainingWidth = width - this.firstColumnWidth;
    let hiddenColumnsCount = 0;
    for (const column in this.columns) {
      if (this.columns[column].isEnabled) {
        if (remainingWidth >= this.columns[column].width) {
          remainingWidth -= this.columns[column].width;
          this.set(`columns.${column}.isVisible`, true);
        } else {
          this.set(`columns.${column}.isVisible`, false);
          hiddenColumnsCount += 1;
          remainingWidth = 0;
        }
      } else {
        this.set(`columns.${column}.isVisible`, false);
      }
    }
    if (this.hiddenColumnsCount !== hiddenColumnsCount) {
      this.set('hiddenColumnsCount', hiddenColumnsCount);
    }
  },

  getEnabledColumnsFromLocalStorage() {
    const enabledColumns = globals.localStorage.getItem(
      `${this.browserPersistedConfigurationKey}.enabledColumns`
    );
    const enabledColumnsList = enabledColumns?.split(',');
    if (enabledColumnsList) {
      for (const column in this.columns) {
        this.set(`columns.${column}.isEnabled`,
          Boolean(enabledColumnsList?.includes(column))
        );
      }
    }
  },
});
