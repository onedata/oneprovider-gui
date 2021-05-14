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
import { observer, computed, get, set } from '@ember/object';
import { reads } from '@ember/object/computed';
import { A } from '@ember/array';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { notEmpty, not } from 'ember-awesome-macros';
import isPopoverOpened from 'onedata-gui-common/utils/is-popover-opened';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { next } from '@ember/runloop';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';

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
   * @type {Function}
   * @param {Array} selectedFiles
   * @returns {Array}
   */
  changeSelectedFiles: notImplementedThrow,

  /**
   * @virtual optional
   * Passed to component inside
   * @type {Function}
   */
  customFetchDirChildren: undefined,

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
   * @type {Models.File}
   */
  fileForConfirmOpenModal: undefined,

  /**
   * Initialized in init.
   * @type {EmberArray<String>}
   */
  loadingIconFileIds: undefined,

  /**
   * Should be set by some instance of `components:fb-table`
   * API for file browser table, methods:
   * - refresh
   * @type {Object}
   */
  fbTableApi: Object.freeze({
    refresh: notImplementedThrow,
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
  selectedFiles: undefined,

  /**
   * Injected property to notify about external selection change, that should enable jump.
   * @type {EmberArray<Models.File>}
   */
  selectedFilesForJump: undefined,

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
   * One of values from `actionContext` enum object
   * @type {ComputedProperty<string>}
   */
  selectionContext: computed(
    'selectedFiles.[]',
    'previewMode',
    function selectionContext() {
      const {
        selectedFiles,
        previewMode,
      } = this.getProperties('selectedFiles', 'previewMode');
      if (selectedFiles) {
        const count = get(selectedFiles, 'length');
        if (count === 0) {
          return 'none';
        }
        let context;
        if (count === 1) {
          if (get(selectedFiles[0], 'type') === 'dir') {
            context = actionContext.singleDir;
          } else {
            context = actionContext.singleFile;
          }
        } else {
          if (selectedFiles.isAny('type', 'dir')) {
            if (selectedFiles.isAny('type', 'file')) {
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

  clickOutsideDeselectHandler: computed(function clickOutsideDeselectHandler() {
    const component = this;
    return function clickOutsideDeselect(mouseEvent) {
      // Check for matching `body *` to not clear selection on destroyed elements click
      // (issue of some elements, that are removed from DOM just after click, like
      // dynamic popover menu items or contextual buttons).
      if (!isPopoverOpened() && mouseEvent.target.matches('body *') &&
        !mouseEvent.target.matches(
          '.fb-table-row *, .fb-breadcrumbs *, .fb-toolbar *, .fb-selection-toolkit *, .webui-popover-content *, .modal-dialog *, .ember-basic-dropdown-content *'
        )) {
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
    'selectedFiles.[]',
    'dir',
    function isCurrentDirSelected() {
      const {
        selectedFiles,
        dir,
      } = this.getProperties('selectedFiles', 'dir');
      return selectedFiles &&
        get(selectedFiles, 'length') === 1 &&
        selectedFiles.includes(dir);
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

  bindBrowserModel: observer('browserModel', function bindBrowserModel() {
    const browserModel = this.get('browserModel');
    if (browserModel) {
      set(browserModel, 'browserInstance', this);
    }
  }),

  ensureSelectedReset: observer('dir', function ensureSelectedReset() {
    const changeSelectedFiles = this.get('changeSelectedFiles');
    next(() => {
      safeExec(this, () => {
        if (this.get('selectedFiles.length') > 0) {
          changeSelectedFiles([]);
        }
      });
    });
  }),

  init() {
    this._super(...arguments);
    if (!this.get('selectedFiles')) {
      this.set('selectedFiles', []);
    }
    if (!this.get('selectedFilesForJump')) {
      this.set('selectedFilesForJump', []);
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

  openFile(file, confirmModal = false) {
    const effFile = get(file, 'effFile');
    if (!effFile) {
      return;
    }
    const isDir = get(effFile, 'type') === 'dir';
    if (isDir) {
      return this.changeDir(effFile);
    } else {
      if (confirmModal) {
        this.set('fileForConfirmOpenModal', file);
      } else {
        return this.onOpenFile(file);
      }
    }
  },

  previewizeContext(context) {
    return `${context}Preview`;
  },

  clearFilesSelection() {
    this.get('changeSelectedFiles')([]);
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

  selectCurrentDir() {
    const {
      changeSelectedFiles,
      dir,
    } = this.getProperties('changeSelectedFiles', 'dir');
    return changeSelectedFiles([dir]);
  },

  changeDir(dir) {
    const {
      updateDirEntityId,
      containerScrollTop,
      browserModel,
    } = this.getProperties(
      'updateDirEntityId',
      'containerScrollTop',
      'browserModel',
    );
    updateDirEntityId(get(dir, 'entityId'));
    browserModel.onChangeDir(dir);
    containerScrollTop(0);
  },

  actions: {
    selectCurrentDir() {
      this.selectCurrentDir();
    },
    openFile(file) {
      return this.openFile(file);
    },
    changeDir(dir) {
      return this.changeDir(dir);
    },
    toggleCurrentDirActions(open) {
      const _open =
        (typeof open === 'boolean') ? open : !this.get('currentDirActionsOpen');
      if (_open) {
        this.selectCurrentDir();
      }
      this.set('currentDirActionsOpen', _open);
    },
    changeSelectedFiles(selectedFiles) {
      return this.get('changeSelectedFiles')(selectedFiles);
    },
    invokeFileAction(file, btnId, ...actionArgs) {
      this.get('changeSelectedFiles')([file]);
      const btn = this.get('allButtonsHash')[btnId];
      if (!btn) {
        throw new Error(
          `component:file-browser#actions.invokeFileAction: no action button with id: ${btnId}`
        );
      }
      next(this, () => btn.action(undefined, ...actionArgs));
    },
    containerScrollTop() {
      this.get('containerScrollTop')(...arguments);
    },
    closeConfirmFileOpenModal() {
      this.set('fileForConfirmOpenModal', null);
    },
    confirmFileOpen() {
      return this.openFile([this.get('fileForConfirmOpenModal')]);
    },
  },
});
