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
import { computed, get } from '@ember/object';
import { collect } from '@ember/object/computed';
import { camelize, dasherize } from '@ember/string';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';
import { hash } from 'ember-awesome-macros';
import isPopoverOpened from 'onedata-gui-common/utils/is-popover-opened';

export const actionContext = {
  none: 'none',
  inDir: 'inDir',
  singleDir: 'singleDir',
  singleFile: 'singleFile',
  multiDir: 'multiDir',
  multiFile: 'multiFile',
  multiMixed: 'multiMixed',
  desktopToolbar: 'desktopToolbar',
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
  'btnDelete',
];

export default Component.extend(I18n, {
  classNames: ['file-browser'],

  i18n: service(),
  fileActions: service(),
  uploadManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser',

  /**
   * Array of selected file records.
   * Initialized to empty array in init.
   * @type EmberArray<object>
   */
  selectedFiles: undefined,

  /**
   * TODO: it should be fetched using dirId
   */
  dir: undefined,

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

  // #region Action buttons

  allButtonsArray: collect(...buttonNames),

  allButtonsHash: hash(...buttonNames),

  btnUpload: computed(function btnUpload() {
    return this.createFileAction({
      id: 'upload',
      elementClass: 'browser-upload',
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
        // TODO: ?
        // actionContext.spaceRootDir,
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

  btnDelete: computed(function btnDelete() {
    return this.createFileAction({
      id: 'delete',
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

  clickOutsideDeselectHandler: computed(function clickOutsideDeselectHandler() {
    const component = this;
    return function clickOutsideDeselect(mouseEvent) {
      if (!isPopoverOpened() &&
        !mouseEvent.target.matches(
          '.fb-table-row *, .fb-breadcrumbs *, .fb-toolbar *, .fb-toolbar *, .fb-selection-toolkit *'
        )) {
        component.clearFilesSelection();
      }
    };
  }),

  init() {
    this._super(...arguments);
    this.set('selectedFiles', A());
  },

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

  createFileAction(actionProperties) {
    const id = get(actionProperties, 'id');
    const fileActions = this.get('fileActions');
    return Object.assign({
      action: () => {
        return fileActions[camelize(`act-${id}`)](
          this.get('selectedFiles'));
      },
      icon: `browser-${dasherize(id)}`,
      title: this.t(`fileActions.${id}`),
      showIn: [],
    }, actionProperties);
  },

  clearFilesSelection() {
    this.get('selectedFiles').clear();
  },
});
