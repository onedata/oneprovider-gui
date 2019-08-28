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
import { computed, get, getProperties } from '@ember/object';
import { collect } from '@ember/object/computed';
import { camelize, dasherize } from '@ember/string';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';
import { hash, notEmpty } from 'ember-awesome-macros';
import isPopoverOpened from 'onedata-gui-common/utils/is-popover-opened';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { all } from 'rsvp';

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
  fileServer: service(),

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
   * If true, the paste from clipboard button should be available
   * @type {Computed<boolean>}
   */
  clipboardReady: notEmpty('fileServer.fileClipboardFiles'),

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
      if (!isPopoverOpened() &&
        !mouseEvent.target.matches(
          '.fb-table-row *, .fb-breadcrumbs *, .fb-toolbar *, .fb-selection-toolkit *, .webui-popover-content *, .modal-dialog *'
        )) {
        component.clearFilesSelection();
      }
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
      showIn: [...anySelected, actionContext.currentDir],
    });
  }),

  btnRename: computed(function btnRename() {
    return this.createFileAction({
      id: 'rename',
      action: () => {
        const {
          openRename,
          selectedFiles,
          dir,
        } = this.getProperties('openRename', 'selectedFiles', 'dir');
        return openRename(selectedFiles[0], dir);
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
      icon: 'clipboard-copy',
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
      showIn: [...anySelected, actionContext.currentDir],
    });
  }),

  separator: computed(function separator() {
    return {
      type: 'separator',
    };
  }),

  // #endregion

  didInsertElement() {
    this._super(...arguments);

    const {
      element,
      uploadManager,
      clickOutsideDeselectHandler,
    } = this.getProperties(
      'element',
      'uploadManager',
      'clickOutsideDeselectHandler'
    );

    document.body.addEventListener(
      'click',
      clickOutsideDeselectHandler
    );

    const uploadDropElement = element.parentElement;
    uploadManager.assignUploadDrop(uploadDropElement);

    const uploadBrowseElement = document.querySelectorAll('.browser-upload');
    uploadManager.assignUploadBrowse(uploadBrowseElement);
  },

  willDestroyElement() {
    this._super(...arguments);
    document.body.removeEventListener(
      'click',
      this.get('clickOutsideDeselectHandler')
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
        return fileActions[camelize(`act-${id}`)](this.get('selectedFiles'));
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
      fileServer,
    } = this.getProperties('dir', 'fileServer');
    const fileClipboardMode = get(fileServer, 'fileClipboardMode');
    const fileClipboardFiles = get(fileServer, 'fileClipboardFiles');
    const dirEntityId = get(dir, 'entityId');
    return all(fileClipboardFiles.map(file =>
      fileServer.copyOrMoveFile(file, dirEntityId, fileClipboardMode)
    ));
  },

  actions: {
    selectCurrentDir(select) {
      this.clearFilesSelection();
      if (select) {
        this.get('selectedFiles').push(this.get('dir'));
      }
    },
    changeDir(dir) {
      console.log('FIXME: file-browser change dir: ' + get(dir, 'name'));
      this.set('dir', dir);
    },
  },
});
