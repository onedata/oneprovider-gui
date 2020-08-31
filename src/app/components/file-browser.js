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
import { computed, get, getProperties } from '@ember/object';
import { collect } from '@ember/object/computed';
import { dasherize } from '@ember/string';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { hash, notEmpty, not } from 'ember-awesome-macros';
import isPopoverOpened from 'onedata-gui-common/utils/is-popover-opened';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import handleMultiFilesOperation from 'oneprovider-gui/utils/handle-multi-files-operation';
import { next } from '@ember/runloop';
import animateCss from 'onedata-gui-common/utils/animate-css';

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

export function getButtonActions(buttonsArray, context) {
  return buttonsArray
    .filter(b => get(b, 'showIn').includes(context));
}

const anySelected = [
  actionContext.singleDir,
  actionContext.singleFile,
  actionContext.multiDir,
  actionContext.multiFile,
  actionContext.multiMixed,
];

const buttonNames = [
  'btnUpload',
  'btnNewDirectory',
  'btnRefresh',
  'btnInfo',
  'btnShare',
  'btnMetadata',
  'btnPermissions',
  'btnDistribution',
  'btnQos',
  'btnRename',
  'btnCopy',
  'btnCut',
  'btnPaste',
  'btnDelete',
];

export default Component.extend(I18n, {
  classNames: ['file-browser'],

  i18n: service(),
  uploadManager: service(),
  fileManager: service(),
  shareManager: service(),
  globalNotify: service(),
  errorExtractor: service(),
  media: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser',

  /**
   * @virtual
   * File model with dir type. It is the currently displayed directory.
   * Can be replaced internally with `changeDir` action.
   * @type {Models/File}
   */
  dir: undefined,

  /**
   * @virtual
   * @type {Function}
   * @param {Models/File} file parent of new directory
   */
  openCreateNewDirectory: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   * @param {Array<Models/File>} files array with files/directories to remove
   */
  openRemove: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   * @param {Models/File} file file to rename
   * @param {Models/File} parentDir parentDir of file to rename
   */
  openRename: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   * @param {Array<Models/File>} files files to edit permissions
   */
  openEditPermissions: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   * @param {Array<Models/File>} files files to show distribution
   */
  openFileDistributionModal: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   * @param {Array<Models/File>} files files to configure QoS
   */
  openQos: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   * @param {Models/File} file file to share
   */
  openShare: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   * @param {Models/File} file file to show its info
   */
  openInfo: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   * @param {Models/File} file file to edit its metadata
   */
  openMetadata: notImplementedThrow,

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
   */
  spacePrivileges: Object.freeze({}),

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
   * One of: move, copy
   * @type {string}
   */
  fileClipboardMode: null,

  /**
   * @type {Array<Models/File}
   */
  fileClipboardFiles: computed(() => []),

  _document: document,

  _body: document.body,

  /**
   * Array of selected file records.
   * @type {EmberArray<Models.File>}
   */
  selectedFiles: Object.freeze([]),

  /**
   * Injected property to notify about external selection change, that should enable jump.
   * @type {EmberArray<Models.File>}
   */
  selectedFilesForJump: Object.freeze([]),

  /**
   * If true, the paste from clipboard button should be available
   * @type {Computed<boolean>}
   */
  clipboardReady: notEmpty('fileClipboardFiles'),

  isRootDir: not('dir.hasParent'),

  showCurrentDirActions: notEmpty('currentDirMenuButtons'),

  /**
   * One of values from `actionContext` enum object
   * @type {ComputedProperty<string>}
   */
  selectionContext: computed('selectedFiles.[]', function selectionContext() {
    const selectedFiles = this.get('selectedFiles');
    if (selectedFiles) {
      const count = get(selectedFiles, 'length');
      if (count === 0) {
        return 'none';
      } else if (count === 1) {
        if (get(selectedFiles[0], 'type') === 'dir') {
          return this.getPreviewContext(actionContext.singleDir);
        } else {
          return this.getPreviewContext(actionContext.singleFile);
        }
      } else {
        if (selectedFiles.isAny('type', 'dir')) {
          if (selectedFiles.isAny('type', 'file')) {
            return this.getPreviewContext(actionContext.multiMixed);
          } else {
            return this.getPreviewContext(actionContext.multiDir);
          }
        } else {
          return this.getPreviewContext(actionContext.multiFile);
        }
      }
    }
  }),

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
    'clipboardReady',
    'previewMode',
    function menuButtons() {
      if (this.get('dir.isShareRoot')) {
        return [];
      } else {
        const {
          allButtonsArray,
          isRootDir,
          clipboardReady,
          previewMode,
        } = this.getProperties(
          'allButtonsArray',
          'isRootDir',
          'clipboardReady',
          'previewMode',
        );
        const context = (isRootDir ? 'spaceRootDir' : 'currentDir') +
          (previewMode ? 'Preview' : '');
        let importedActions = getButtonActions(
          allButtonsArray,
          context
        );
        if (!clipboardReady) {
          importedActions = importedActions.rejectBy('id', 'paste');
        }
        if (get(importedActions, 'length')) {
          return [
            { separator: true, title: this.t('menuCurrentDir') },
            ...importedActions,
          ];
        } else {
          return [];
        }
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

  // #region Action buttons

  allButtonsArray: collect(...buttonNames),

  allButtonsHash: hash(...buttonNames),

  btnUpload: computed(function btnUpload() {
    return this.createFileAction({
      id: 'upload',
      class: 'browser-upload',
      action: () => this.get('uploadManager').triggerUploadDialog(),
      showIn: [
        actionContext.inDir,
        actionContext.currentDir,
        actionContext.spaceRootDir,
      ],
    });
  }),

  btnNewDirectory: computed(function btnNewDirectory() {
    return this.createFileAction({
      id: 'newDirectory',
      action: () => this.get('openCreateNewDirectory')(this.get('dir')),
      showIn: [
        actionContext.inDir,
        actionContext.currentDir,
        actionContext.spaceRootDir,
      ],
    });
  }),

  btnRefresh: computed(function btnRefresh() {
    return this.createFileAction({
      id: 'refresh',
      icon: 'refresh',
      action: () => {
        const {
          globalNotify,
          fbTableApi,
        } = this.getProperties('globalNotify', 'fbTableApi');
        animateCss(this.$('.fb-toolbar-button.file-action-refresh')[0], 'pulse-mint');
        return fbTableApi.refresh()
          .catch(error => {
            globalNotify.backendError(this.t('refreshingDirectory'), error);
            throw error;
          });
      },
      showIn: [
        actionContext.inDir,
        actionContext.inDirPreview,
        actionContext.currentDir,
        actionContext.currentDirPreview,
        actionContext.spaceRootDir,
        actionContext.spaceRootDirPreview,
      ],
    });
  }),

  btnShare: computed(function btnShare() {
    return this.createFileAction({
      id: 'share',
      action: (files) => {
        return this.get('openShare')(files[0]);
      },
      showIn: [
        actionContext.singleFile,
        actionContext.singleDir,
        actionContext.currentDir,
        actionContext.spaceRootDir,
      ],
    });
  }),

  btnMetadata: computed(function btnMetadata() {
    return this.createFileAction({
      id: 'metadata',
      action: (files) => {
        return this.get('openMetadata')(files[0]);
      },
      showIn: [
        actionContext.singleDir,
        actionContext.singleFile,
        actionContext.currentDir,
        actionContext.spaceRootDir,
      ],
    });
  }),

  btnInfo: computed(function btnInfo() {
    return this.createFileAction({
      id: 'info',
      action: (files) => {
        return this.get('openInfo')(files[0]);
      },
      showIn: [
        actionContext.spaceRootDir,
        actionContext.singleDir,
        actionContext.singleFile,
        actionContext.currentDir,
        actionContext.spaceRootDirPreview,
        actionContext.singleDirPreview,
        actionContext.singleFilePreview,
        actionContext.currentDirPreview,
      ],
    });
  }),

  btnRename: computed(function btnRename() {
    return this.createFileAction({
      id: 'rename',
      action: (files) => {
        const {
          openRename,
          dir,
        } = this.getProperties('openRename', 'dir');
        return openRename(files[0], dir);
      },
      showIn: [
        actionContext.singleDir,
        actionContext.singleFile,
        actionContext.currentDir,
      ],
    });
  }),

  btnPermissions: computed(function btnPermissions() {
    return this.createFileAction({
      id: 'permissions',
      action: (files) => {
        return this.get('openEditPermissions')(files);
      },
      showIn: [
        ...anySelected,
        actionContext.currentDir,
      ],
    });
  }),

  btnCopy: computed(function btnCopy() {
    return this.createFileAction({
      id: 'copy',
      action: (files) => {
        this.setProperties({
          fileClipboardFiles: files,
          fileClipboardMode: 'copy',
        });
      },
      showIn: anySelected,
    });
  }),

  btnCut: computed(function btnCut() {
    return this.createFileAction({
      id: 'cut',
      action: (files) => {
        this.setProperties({
          fileClipboardFiles: files,
          fileClipboardMode: 'move',
        });
      },
      showIn: anySelected,
    });
  }),

  btnPaste: computed(function btnPaste() {
    return this.createFileAction({
      id: 'paste',
      action: () => this.pasteFiles(),
      showIn: [
        actionContext.currentDir,
        actionContext.spaceRootDir,
        actionContext.inDir,
      ],
    });
  }),

  btnDelete: computed(function btnDelete() {
    return this.createFileAction({
      id: 'delete',
      action: (files) => {
        const {
          openRemove,
          dir,
        } = this.getProperties('openRemove', 'dir');
        return openRemove(files, dir);
      },
      showIn: anySelected,
    });
  }),

  btnDistribution: computed(function btnDistribution() {
    return this.createFileAction({
      id: 'distribution',
      showIn: [
        ...anySelected,
        actionContext.currentDir,
        actionContext.spaceRootDir,
      ],
      action: (files) => {
        return this.get('openFileDistributionModal')(files);
      },
    });
  }),

  btnQos: computed('spacePrivileges.{viewQos,manageQos}', 'openQos', function btnQos() {
    const {
      spacePrivileges,
      openQos,
    } = this.getProperties('spacePrivileges', 'openQos');
    const canView = get(spacePrivileges, 'viewQos');
    const disabled = !canView;
    return this.createFileAction({
      id: 'qos',
      icon: 'qos',
      showIn: [
        ...anySelected,
        actionContext.currentDir,
        actionContext.spaceRootDir,
      ],
      disabled,
      tip: disabled ? this.t('hintQosForbidden') : undefined,
      action: (files) => {
        return openQos(files);
      },
    });
  }),

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

  // #endregion

  didInsertElement() {
    this._super(...arguments);

    const {
      element,
      uploadManager,
      clickOutsideDeselectHandler,
      dir,
    } = this.getProperties(
      'element',
      'uploadManager',
      'clickOutsideDeselectHandler',
      'dir'
    );

    this.get('_body').addEventListener(
      'click',
      clickOutsideDeselectHandler
    );

    const uploadDropElement = element.parentElement;
    uploadManager.assignUploadDrop(uploadDropElement);

    const uploadBrowseElement = this.get('_document')
      .querySelector('.fb-upload-trigger');
    uploadManager.assignUploadBrowse(uploadBrowseElement);
    uploadManager.changeTargetDirectory(dir);

    this.$('.fb-table')[0].addEventListener(
      'contextmenu',
      this.get('currentDirContextMenuHandler')
    );
  },

  willDestroyElement() {
    this._super(...arguments);
    this.get('_body').removeEventListener(
      'click',
      this.get('clickOutsideDeselectHandler')
    );
    this.get('element').removeEventListener(
      'contextmenu',
      this.get('currentDirContextMenuHandler')
    );
  },

  getPreviewContext(context) {
    return this.get('previewMode') ? `${context}Preview` : context;
  },

  /**
   * Create button or popover menu item for controlling files.
   * @param {object} actionProperties properties of action button:
   *  - id: string
   *  - action: optional function
   *  - icon: optional string, if not provided will be generated
   *  - title: string
   *  - showIn: array of strings from arrayContext
   *  - class: string, classes added to element
   * @returns {EmberObject}
   */
  createFileAction(actionProperties) {
    const {
      id,
      title,
      icon,
      showIn,
      action,
      disabled,
      class: elementClass,
    } = getProperties(
      actionProperties,
      'id',
      'title',
      'icon',
      'showIn',
      'action',
      'disabled',
      'class'
    );
    return Object.assign({}, actionProperties, {
      icon: icon || `browser-${dasherize(id)}`,
      title: title || this.t(`fileActions.${id}`),
      showIn: showIn || [],
      disabled: disabled === undefined ? false : disabled,
      action: (files) => {
        return action(files || this.get('selectedFiles'));
      },
      class: `file-action-${id} ${elementClass || ''}`,
    });
  },

  clearFilesSelection() {
    this.get('changeSelectedFiles')([]);
  },

  clearFileClipboard() {
    this.setProperties({
      fileClipboardMode: null,
      fileClipboardFiles: [],
    });
  },

  pasteFiles() {
    const {
      dir,
      fileManager,
      globalNotify,
      errorExtractor,
      i18n,
      i18nPrefix,
    } = this.getProperties(
      'dir',
      'fileManager',
      'globalNotify',
      'errorExtractor',
      'i18n',
      'i18nPrefix',
    );
    const {
      fileClipboardMode,
      fileClipboardFiles,
    } = this.getProperties(
      'fileClipboardMode',
      'fileClipboardFiles',
    );
    const dirEntityId = get(dir, 'entityId');

    return handleMultiFilesOperation({
        files: fileClipboardFiles,
        globalNotify,
        errorExtractor,
        i18n,
        operationErrorKey: `${i18nPrefix}.pasteFailed.${fileClipboardMode}`,
        operationOptions: {
          dirEntityId,
          fileClipboardMode,
        },
      },
      (file, { dirEntityId, fileClipboardMode }) => {
        return fileManager.copyOrMoveFile(file, dirEntityId, fileClipboardMode);
      }
    ).finally(() => {
      if (fileClipboardMode === 'move') {
        this.clearFileClipboard();
      }
    });
  },

  selectCurrentDir(select = true) {
    if (select) {
      const {
        changeSelectedFiles,
        dir,
      } = this.getProperties('changeSelectedFiles', 'dir');
      return changeSelectedFiles([dir]);
    }
  },

  actions: {
    selectCurrentDir(select) {
      this.selectCurrentDir(select);
    },
    changeDir(dir) {
      const {
        updateDirEntityId,
        uploadManager,
        containerScrollTop,
      } = this.getProperties(
        'updateDirEntityId',
        'uploadManager',
        'containerScrollTop',
      );
      updateDirEntityId(get(dir, 'entityId'));
      uploadManager.changeTargetDirectory(dir);
      containerScrollTop(0);
    },
    toggleCurrentDirActions(open) {
      const _open =
        (typeof open === 'boolean') ? open : !this.get('currentDirActionsOpen');
      this.set('currentDirActionsOpen', _open);
    },
    changeSelectedFiles(selectedFiles) {
      return this.get('changeSelectedFiles')(selectedFiles);
    },
    invokeFileAction(file, btnName) {
      this.get('changeSelectedFiles')([file]);
      next(this, () => this.get(btnName).action());
    },
    containerScrollTop() {
      this.get('containerScrollTop')(...arguments);
    },
  },
});
