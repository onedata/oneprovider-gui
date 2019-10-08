/**
 * A complete file browser with infinite-scrolled file list, directory
 * breadcrumbs and toolkit for selected files.
 * 
 * @module components/file-browser
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get, getProperties, observer } from '@ember/object';
import { collect } from '@ember/object/computed';
import { camelize, dasherize } from '@ember/string';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';
import { hash, notEmpty, not } from 'ember-awesome-macros';
import isPopoverOpened from 'onedata-gui-common/utils/is-popover-opened';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import handleMultiFilesOperation from 'oneprovider-gui/utils/handle-multi-files-operation';

export const actionContext = {
  none: 'none',
  inDir: 'inDir',
  singleDir: 'singleDir',
  singleFile: 'singleFile',
  multiDir: 'multiDir',
  multiFile: 'multiFile',
  multiMixed: 'multiMixed',
  currentDir: 'currentDir',
  spaceRootDir: 'spaceRootDir',
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
  'btnInfo',
  'btnShare',
  'btnMetadata',
  'btnPermissions',
  'btnDistribution',
  'btnRename',
  'btnCopy',
  'btnCut',
  'btnPaste',
  'btnDelete',
];

export default Component.extend(I18n, {
  classNames: ['file-browser'],

  i18n: service(),
  fileActions: service(),
  uploadManager: service(),
  fileManager: service(),
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
   */
  updateDirEntityId: notImplementedIgnore,

  /**
   * @virtual optional
   */
  containerScrollTop: notImplementedIgnore,

  /**
   * If true, the paste from clipboard button should be available
   * @type {Computed<boolean>}
   */
  clipboardReady: notEmpty('fileManager.fileClipboardFiles'),

  isRootDir: not('dir.hasParent'),

  /**
   * Array of selected file records.
   * @type {EmberArray<object>}
   */
  selectedFiles: computed(() => A()),

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
          return actionContext.singleDir;
        } else {
          return actionContext.singleFile;
        }
      } else {
        if (selectedFiles.isAny('type', 'dir')) {
          if (selectedFiles.isAny('type', 'file')) {
            return actionContext.multiMixed;
          } else {
            return actionContext.multiDir;
          }
        } else {
          return actionContext.multiFile;
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
          '.fb-table-row *, .fb-breadcrumbs *, .fb-toolbar *, .fb-selection-toolkit *, .webui-popover-content *, .modal-dialog *'
        )) {
        component.clearFilesSelection();
      }
    };
  }),

  currentDirMenuButtons: computed(
    'allButtonsArray',
    'isRootDir',
    'clipboardReady',
    function menuButtons() {
      const {
        allButtonsArray,
        isRootDir,
        clipboardReady,
      } = this.getProperties('allButtonsArray', 'isRootDir', 'clipboardReady');
      let importedActions = getButtonActions(
        allButtonsArray,
        isRootDir ? 'spaceRootDir' : 'currentDir'
      );
      if (!clipboardReady) {
        importedActions = importedActions.rejectBy('id', 'paste');
      }
      return [
        { separator: true, title: this.t('menuCurrentDir') },
        ...importedActions,
      ];
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

  // #region Action buttons

  allButtonsArray: collect(...buttonNames),

  allButtonsHash: hash(...buttonNames),

  btnUpload: computed(function btnUpload() {
    return this.createFileAction({
      id: 'upload',
      class: 'browser-upload',
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

  btnShare: computed(function btnShare() {
    return this.createFileAction({
      id: 'share',
      showIn: [
        actionContext.singleDir,
        actionContext.currentDir,
        actionContext.spaceRootDir,
      ],
    });
  }),

  btnMetadata: computed(function btnMetadata() {
    return this.createFileAction({
      id: 'metadata',
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
      action: () => {
        const {
          openInfo,
          selectedFiles,
        } = this.getProperties('openInfo', 'selectedFiles');
        return openInfo(selectedFiles[0]);
      },
      showIn: [
        actionContext.spaceRootDir,
        actionContext.singleDir,
        actionContext.singleFile,
        actionContext.currentDir,
      ],
    });
  }),

  btnRename: computed(function btnRename() {
    return this.createFileAction({
      id: 'rename',
      action: () => {
        const {
          openRename,
          selectedFiles,
        } = this.getProperties('openRename', 'selectedFiles');
        return openRename(selectedFiles[0]);
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
      action: () => {
        const {
          openEditPermissions,
          selectedFiles,
        } = this.getProperties('openEditPermissions', 'selectedFiles');
        return openEditPermissions(selectedFiles);
      },
      showIn: [...anySelected, actionContext.currentDir],
    });
  }),

  btnCopy: computed(function btnCopy() {
    return this.createFileAction({
      id: 'copy',
      showIn: anySelected,
    });
  }),

  btnCut: computed(function btnCut() {
    return this.createFileAction({
      id: 'cut',
      showIn: anySelected,
    });
  }),

  btnPaste: computed(function btnCut() {
    return this.createFileAction({
      id: 'paste',
      action: () => {
        return this.pasteFiles();
      },
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
      action: () => this.get('openRemove')(
        this.get('selectedFiles'),
        this.get('dir')
      ),
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
      action: () => {
        const {
          openFileDistributionModal,
          selectedFiles,
        } = this.getProperties('openFileDistributionModal', 'selectedFiles');
        return openFileDistributionModal(selectedFiles.toArray());
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
      const $this = this.$();
      const tableOffset = $this.offset();
      const left = mouseEvent.clientX - tableOffset.left + this.element
        .offsetLeft;
      const top = mouseEvent.clientY - tableOffset.top + this.element.offsetTop;
      this.$('.current-dir-actions-trigger').css({
        top,
        left,
      });
      // cause popover refresh
      if (this.get('currentDirActionsOpen')) {
        window.dispatchEvent(new Event('resize'));
      }
      this.actions.toggleCurrentDirActions.bind(this)(true);
    };
  }),

  // #endregion

  dirChangedObserver: observer('dir', function dirChangedObserver() {
    this.get('updateDirEntityId')(this.get('dir.entityId'));
    this.get('containerScrollTop')(0);
  }),

  init() {
    this._super(...arguments);
    this.dirChangedObserver();
  },

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

    document.body.addEventListener(
      'click',
      clickOutsideDeselectHandler
    );

    const uploadDropElement = element.parentElement;
    uploadManager.assignUploadDrop(uploadDropElement);

    const uploadBrowseElement = document.querySelector('.fb-upload-trigger');
    uploadManager.assignUploadBrowse(uploadBrowseElement);
    uploadManager.changeTargetDirectory(dir);

    this.$('.fb-table')[0].addEventListener(
      'contextmenu',
      this.get('currentDirContextMenuHandler')
    );
  },

  willDestroyElement() {
    this._super(...arguments);
    document.body.removeEventListener(
      'click',
      this.get('clickOutsideDeselectHandler')
    );
    this.element.removeEventListener(
      'contextmenu',
      this.get('currentDirContextMenuHandler')
    );
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
      icon,
      action,
      class: elementClass,
    } = getProperties(actionProperties, 'id', 'icon', 'action', 'class');
    const fileActions = this.get('fileActions');
    return Object.assign({
      action: action || (() => {
        let predefinedAction = fileActions[camelize(`act-${id}`)];
        if (typeof predefinedAction === 'function') {
          predefinedAction = predefinedAction.bind(fileActions);
          return predefinedAction(this.get('selectedFiles'));
        }
      }),
      icon: icon || `browser-${dasherize(id)}`,
      title: this.t(`fileActions.${id}`),
      showIn: [],
      class: [`file-action-${id}`, ...(elementClass || [])],
    }, actionProperties);
  },

  clearFilesSelection() {
    this.get('selectedFiles').clear();
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
    const fileClipboardMode = get(fileManager, 'fileClipboardMode');
    const fileClipboardFiles = get(fileManager, 'fileClipboardFiles');
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
        fileManager.clearFileClipboard();
      }
    });
  },

  selectCurrentDir(select = true) {
    this.clearFilesSelection();
    if (select) {
      this.get('selectedFiles').push(this.get('dir'));
    }
  },

  actions: {
    selectCurrentDir(select) {
      this.selectCurrentDir(select);
    },
    changeDir(dir) {
      this.set('dir', dir);
      this.get('uploadManager').changeTargetDirectory(dir);
    },
    toggleCurrentDirActions(open) {
      const _open =
        (typeof open === 'boolean') ? open : !this.get('currentDirActionsOpen');
      this.set('currentDirActionsOpen', _open);
    },
    currentDirActionsToggled(opened) {
      this.get('currentDirActionsToggled')(opened);
    },
  },
});
