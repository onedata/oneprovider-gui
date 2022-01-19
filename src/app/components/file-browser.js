/**
 * A complete file browser with infinite-scrolled file list, directory
 * breadcrumbs and toolkit for selected files.
 *
 * @module components/file-browser
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { observer, computed, get, set, getProperties } from '@ember/object';
import { reads } from '@ember/object/computed';
import { A } from '@ember/array';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { notEmpty, not, raw, collect, and, bool, or, equal } from 'ember-awesome-macros';
import isPopoverOpened from 'onedata-gui-common/utils/is-popover-opened';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { next } from '@ember/runloop';
import $ from 'jquery';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import defaultResolveParent from 'oneprovider-gui/utils/default-resolve-parent';

export const actionContext = {
  none: 'none',
  inDir: 'inDir',
  inDirPreview: 'inDirPreview',
  singleDir: 'singleDir',
  singleDirPreview: 'singleDirPreview',
  singleFile: 'singleFile',
  singleFilePreview: 'singleFilePreview',
  multiDir: 'multiDir',
  mutliDirPreview: 'mutliDirPreview',
  multiFile: 'multiFile',
  multiFilePreview: 'multiFilePreview',
  multiMixed: 'multiMixed',
  multiMixedPreview: 'multiMixedPreview',
  currentDir: 'currentDir',
  currentDirPreview: 'currentDirPreview',
  spaceRootDir: 'spaceRootDir',
  spaceRootDirPreview: 'spaceRootDirPreview',
};

export const anySelectedContexts = [
  actionContext.singleDir,
  actionContext.singleFile,
  actionContext.multiDir,
  actionContext.multiFile,
  actionContext.multiMixed,
];

export function getButtonActions(buttonsArray, context) {
  return buttonsArray
    .filter(b => get(b, 'showIn').includes(context));
}

export default Component.extend(I18n, {
  classNames: ['file-browser'],
  classNameBindings: ['browserClass'],

  i18n: service(),
  globalNotify: service(),
  errorExtractor: service(),
  media: service(),
  isMobile: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser',

  /**
   * @virtual
   * @type {EmberObject}
   */
  browserModel: undefined,

  /**
   * @virtual
   * File model with dir type. It is the currently displayed directory.
   * Can be replaced internally with `changeDir` action.
   * @type {Models/File}
   */
  dir: undefined,

  /**
   * @virtual
   */
  updateDirEntityId: notImplementedIgnore,

  /**
   * @virtual
   * @async
   * @type {Function}
   * @param {Array} selectedItems
   * @returns {Promise}
   */
  changeSelectedItems: notImplementedThrow,

  /**
   * @virtual optional
   * Passed to component inside
   * @type {Function}
   */
  customFetchDirChildren: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  getItemByIdFun: notImplementedReject,

  /**
   * @virtual
   * @type {Models.File}
   */
  customRootDir: undefined,

  /**
   * @virtual
   * @type {boolean}
   */
  previewMode: false,

  /**
   * @virtual
   * @type {Boolean}
   */
  isSpaceOwned: undefined,

  /**
   * Needed to create symlinks. In read-only views it is optional
   * @virtual optional
   * @type {String}
   */
  spaceId: undefined,

  /**
   * @virtual
   */
  spacePrivileges: Object.freeze({}),

  /**
   * @virtual optional
   * @type {Function}
   */
  resolveFileParentFun: defaultResolveParent,

  /**
   * If boolean - enable selection toolkit in both desktop and mobile mode.
   * If object - specify in which modes the toolkit should be rendered:
   * `{ desktop: boolean, mobile: boolean }`.
   * @virtual optional
   * @type {Boolean|Object}
   */
  showSelectionToolkit: true,

  /**
   * Selector of modal that is parent of the browser.
   * @virtual optional
   * @type {String}
   */
  parentModalDialogSelector: '',

  /**
   * CSS selector of element(s) which click on SHOULD NOT cause selection to be cleared
   * in browser.
   * @virtual optional
   * @type {String}
   */
  ignoreDeselectSelector: '',

  /**
   * Passes `fbTableApi` on it's change.
   * @virtual optional
   * @type {(api: FbTableApi) => any}
   */
  onRegisterApi: notImplementedIgnore,

  /**
   * Initialized in init.
   * @type {EmberArray<String>}
   */
  loadingIconFileIds: undefined,

  /**
   * Should be set by some instance of `components:fb-table`
   * API for file browser table.
   * @type {FbTableApi}
   */
  fbTableApi: Object.freeze({
    refresh: notImplementedThrow,
    getFilesArray: notImplementedThrow,
    forceSelectAndJump: notImplementedThrow,
    recomputeTableItems: notImplementedThrow,
  }),

  /**
   * @type {Array<Models.File>}
   */
  fileClipboardFiles: Object.freeze([]),

  /**
   * @type {String}
   */
  fileClipboardMode: null,

  _document: document,

  _body: document.body,

  /**
   * Array of selected file records.
   * @type {EmberArray<Models.File>}
   */
  selectedItems: undefined,

  /**
   * Injected property to notify about external selection change, that should enable jump.
   * @type {PromiseArray<Object>} array proxy of browsable objects (eg. file)
   */
  selectedItemsForJumpProxy: undefined,

  selectedItemsForJump: reads('selectedItemsForJumpProxy.content'),

  isInModal: bool('parentModalDialogSelector'),

  renderSelectionToolkitDesktop: and(
    not('media.isMobile'),
    or(
      equal('showSelectionToolkit', raw(true)),
      'showSelectionToolkit.desktop'
    ),
    not('previewMode')
  ),

  renderSelectionToolkitMobile: and(
    'media.isMobile',
    or(
      equal('showSelectionToolkit', raw(true)),
      'showSelectionToolkit.mobile'
    ),
    not('previewMode')
  ),

  /**
   * @type {ComputedProperty<Array<String>>}
   */
  buttonNames: reads('browserModel.buttonNames'),

  /**
   * @type {ComputedProperty<String>}
   */
  browserClass: reads('browserModel.browserClass'),

  /**
   * @type {ComputedProperty<String>}
   */
  rootIcon: reads('browserModel.rootIcon'),

  isRootDir: not('dir.hasParent'),

  showCurrentDirActions: notEmpty('currentDirMenuButtons'),

  /**
   * True if there is no action applicable for items (only current dir actions)
   * @tyep {ComputedProperty<Boolean>}
   */
  noItemsActions: computed(
    'browserModel', 'allButtonsArray.[]',
    function noItemsActions() {
      if (!this.get('browserModel')) {
        return;
      }
      return !this.get('allButtonsArray')
        .mapBy('showIn')
        .some(showIn =>
          showIn.some(actionContext => anySelectedContexts.includes(actionContext))
        );
    }
  ),

  /**
   * One of values from `actionContext` enum object
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

  insideBrowserSelectors: Object.freeze([
    '.fb-table-row',
    '.fb-table-row *',
    '.fb-breadcrumbs *',
    '.fb-toolbar *',
    '.fb-selection-toolkit *',
    '.special-dir-view *',
  ]),

  floatingItemsSelectors: collect(
    raw('.btn-global-copy-button'),
    raw('.webui-popover-content *'),
    raw('.ember-basic-dropdown-content *'),
    computed('parentModalDialogSelector', function floatingItemsSelectorsModal() {
      const parentModalDialogSelector = this.get('parentModalDialogSelector');
      let selector = '.modal-dialog';
      if (parentModalDialogSelector) {
        selector += `:not(${parentModalDialogSelector})`;
      }
      return `${selector} *`;
    }),
  ),

  clickInsideSelector: computed(
    'insideBrowserSelectors',
    'floatingItemsSelectors',
    'ignoreDeselectSelector',
    function clickInsideSelector() {
      const {
        insideBrowserSelectors,
        floatingItemsSelectors,
        ignoreDeselectSelector,
        elementId,
      } = this.getProperties(
        'insideBrowserSelectors',
        'floatingItemsSelectors',
        'ignoreDeselectSelector',
        'elementId'
      );
      const selectors = [
        ...insideBrowserSelectors
        .map(selector => `#${elementId} ${selector}`),
        ...floatingItemsSelectors,
      ];
      if (ignoreDeselectSelector) {
        selectors.push(ignoreDeselectSelector);
      }
      return selectors.join(', ');
    }
  ),

  clickInsideExceptionsSelector: computed('elementId', function clickInsideExceptionsSelector() {
    const elementId = this.get('elementId');
    return [
      '.fb-table-row.item-disabled',
      '.fb-table-row.item-disabled *',
    ].map(selector => `#${elementId} ${selector}`).join(', ');
  }),

  clickOutsideDeselectHandler: computed(function clickOutsideDeselectHandler() {
    const component = this;
    return function clickOutsideDeselect(mouseEvent) {
      // Check for matching `body *` to not clear selection on destroyed elements click
      // (issue of some elements, that are removed from DOM just after click, like
      // dynamic popover menu items or contextual buttons).
      const target = mouseEvent.target;
      const $target = $(target);
      const {
        clickInsideSelector,
        clickInsideExceptionsSelector,
      } = getProperties(
        component,
        'clickInsideSelector',
        'clickInsideExceptionsSelector'
      );

      if (
        !isPopoverOpened() &&
        target.matches('body *') &&
        // jQuery is must be used for backward compatibility: https://caniuse.com/css-not-sel-list
        (
          !$target.is(clickInsideSelector) ||
          $target.is(clickInsideExceptionsSelector)
        )
      ) {
        component.clearFilesSelection();
      }
    };
  }),

  currentDirMenuButtons: computed(
    'allButtonsArray',
    'isRootDir',
    'fileClipboardMode',
    'previewMode',
    function menuButtons() {
      const {
        allButtonsArray,
        isRootDir,
        previewMode,
        browserModel,
      } = this.getProperties(
        'allButtonsArray',
        'isRootDir',
        'previewMode',
        'browserModel',
      );
      const context = (isRootDir ? 'spaceRootDir' : 'currentDir') +
        (previewMode ? 'Preview' : '');
      let buttonActions = getButtonActions(
        allButtonsArray,
        context
      );
      buttonActions = browserModel.getCurrentDirMenuButtons(buttonActions);
      if (get(buttonActions, 'length')) {
        return [{
            separator: true,
            title: get(browserModel, 'currentDirTranslation') || this.t('menuCurrentDir'),
          },
          ...buttonActions,
        ];
      } else {
        return [];
      }
    }
  ),

  currentDirContextMenuHandler: computed(function currentDirContextMenuHandler() {
    const component = this;
    const openCurrentDirContextMenu = component.get('openCurrentDirContextMenu');
    return function oncontextmenu(contextmenuEvent) {
      component.selectCurrentDir();
      openCurrentDirContextMenu(contextmenuEvent);
      contextmenuEvent.preventDefault();
    };
  }),

  isOnlyCurrentDirSelected: computed(
    'selectedItems.[]',
    'dir',
    function isCurrentDirSelected() {
      const {
        selectedItems,
        dir,
      } = this.getProperties('selectedItems', 'dir');
      return selectedItems &&
        get(selectedItems, 'length') === 1 &&
        selectedItems.includes(dir);
    }
  ),

  contentScroll: computed(function contentScroll() {
    return document.getElementById('content-scroll');
  }),

  containerScrollTop: computed('contentScroll', function containerScrollTop() {
    const contentScroll = this.get('contentScroll');
    return (position, isDelta = false) => {
      contentScroll.scrollTo(
        null,
        (isDelta ? contentScroll.scrollTop : 0) + position
      );
    };
  }),

  allButtonsArray: reads('browserModel.allButtonsArray'),

  allButtonsHash: reads('browserModel.allButtonsHash'),

  separator: computed(function separator() {
    return {
      type: 'separator',
    };
  }),

  openCurrentDirContextMenu: computed(function openCurrentDirContextMenu() {
    return (mouseEvent) => {
      if (!this.get('showCurrentDirActions')) {
        return;
      }

      const element = this.get('element');
      const $this = this.$();
      const tableOffset = $this.offset();
      const left = mouseEvent.clientX - tableOffset.left + element.offsetLeft;
      const top = mouseEvent.clientY - tableOffset.top + element.offsetTop;
      this.$('.current-dir-actions-trigger').css({
        top,
        left,
      });
      // cause popover refresh
      if (this.get('currentDirActionsOpen')) {
        window.dispatchEvent(new Event('resize'));
      }
      this.send('toggleCurrentDirActions', true);
    };
  }),

  /**
   * Stores mapping of `itemId` -> `itemParentId` to be used when resolving
   * parent is ambiguous (eg. when entering symlinked directory we want to render
   * breadcrums and want to resolve symlinked dir as a parent, while it's not current
   * dir parent).
   *
   * Computed property initializes empty cache for every `browserModel` change.
   * @type {ComputedProperty<Object>}
   */
  parentsCache: computed('browserModel', function parentsCache() {
    return {};
  }),

  bindBrowserModel: observer('browserModel', function bindBrowserModel() {
    const browserModel = this.get('browserModel');
    if (browserModel) {
      set(browserModel, 'browserInstance', this);
    }
  }),

  fbTableApiObserver: observer('fbTableApi', function fbTableApiObserver() {
    const {
      fbTableApi,
      onRegisterApi,
    } = this.getProperties('fbTableApi', 'onRegisterApi');
    if (onRegisterApi) {
      onRegisterApi(fbTableApi);
    }
  }),

  init() {
    this._super(...arguments);
    if (!this.get('selectedItems')) {
      this.set('selectedItems', []);
    }
    this.set('loadingIconFileIds', A());
    if (!this.get('browserModel')) {
      throw new Error(
        'component:file-browser#init: no browserModel provided'
      );
    }
    this.bindBrowserModel();
  },

  didInsertElement() {
    this._super(...arguments);

    const {
      _body,
      element,
      clickOutsideDeselectHandler,
      currentDirContextMenuHandler,
      browserModel,
    } = this.getProperties(
      '_body',
      'element',
      'clickOutsideDeselectHandler',
      'currentDirContextMenuHandler',
      'browserModel',
    );

    _body.addEventListener(
      'click',
      clickOutsideDeselectHandler
    );

    element.querySelector('.fb-table').addEventListener(
      'contextmenu',
      currentDirContextMenuHandler
    );

    browserModel.onInsertElement();
  },

  willDestroyElement() {
    this._super(...arguments);
    const {
      _body,
      element,
      clickOutsideDeselectHandler,
      currentDirContextMenuHandler,
    } = this.getProperties(
      '_body',
      'element',
      'clickOutsideDeselectHandler',
      'currentDirContextMenuHandler',
    );
    _body.removeEventListener(
      'click',
      clickOutsideDeselectHandler
    );
    element.removeEventListener(
      'contextmenu',
      currentDirContextMenuHandler
    );
  },

  onOpenFile(...args) {
    const browserModel = this.get('browserModel');
    if (browserModel && browserModel.onOpenFile) {
      return browserModel.onOpenFile(...args);
    } else {
      return notImplementedIgnore();
    }
  },

  openFile(file, options = {}) {
    const effFile = get(file, 'effFile');
    if (!effFile) {
      return;
    }
    const isDir = get(file, 'type') === 'dir' ||
      get(effFile, 'type') === 'dir';
    if (isDir) {
      const {
        dir: parentDir,
        parentsCache,
      } = this.getProperties('dir', 'parentsCache');
      const parentDirId = get(parentDir, 'entityId');
      const openedDirId = get(file, 'entityId');
      // avoid circular parent dependencies
      if (parentsCache[parentDirId] !== openedDirId) {
        parentsCache[openedDirId] = parentDirId;
      }
      return this.changeDir(file);
    } else {
      return this.onOpenFile(file, options);
    }
  },

  previewizeContext(context) {
    return `${context}Preview`;
  },

  clearFilesSelection() {
    this.get('changeSelectedItems')([]);
  },

  clearFileClipboard() {
    this.setProperties({
      fileClipboardFiles: [],
      fileClipboardMode: null,
    });
  },

  setFileClipboardFiles(files) {
    this.set('fileClipboardFiles', files);
  },

  setFileClipboardMode(mode) {
    this.set('fileClipboardMode', mode);
  },

  async selectCurrentDir() {
    const {
      changeSelectedItems,
      dir,
    } = this.getProperties('changeSelectedItems', 'dir');
    return changeSelectedItems([dir]);
  },

  async changeDir(dir) {
    const {
      updateDirEntityId,
      containerScrollTop,
      browserModel,
    } = this.getProperties(
      'updateDirEntityId',
      'containerScrollTop',
      'browserModel',
    );
    await updateDirEntityId(get(dir, 'entityId'));
    browserModel.onChangeDir(dir);
    containerScrollTop(0);
  },

  actions: {
    selectCurrentDir() {
      return this.selectCurrentDir();
    },
    openFile(file, options) {
      return this.openFile(file, options);
    },
    changeDir(dir) {
      return this.changeDir(dir);
    },
    async toggleCurrentDirActions(open) {
      if (!this.get('showCurrentDirActions')) {
        return;
      }

      const _open =
        (typeof open === 'boolean') ? open : !this.get('currentDirActionsOpen');
      if (_open) {
        await this.selectCurrentDir();
      }
      this.set('currentDirActionsOpen', _open);
    },
    changeSelectedItems(selectedItems) {
      return this.get('changeSelectedItems')(selectedItems);
    },
    async invokeFileAction(file, btnId, ...actionArgs) {
      const selectedFiles = [file];
      await this.get('changeSelectedItems')(selectedFiles);
      const btn = this.get('allButtonsHash')[btnId];
      if (!btn) {
        throw new Error(
          `component:file-browser#actions.invokeFileAction: no action button with id: ${btnId}`
        );
      }
      next(this, () => btn.action(selectedFiles, ...actionArgs));
    },
    containerScrollTop() {
      this.get('containerScrollTop')(...arguments);
    },
  },
});
