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
import { A } from '@ember/array';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { hash, notEmpty, not } from 'ember-awesome-macros';
import isPopoverOpened from 'onedata-gui-common/utils/is-popover-opened';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import handleMultiFilesOperation from 'oneprovider-gui/utils/handle-multi-files-operation';
import { next, later } from '@ember/runloop';
import animateCss from 'onedata-gui-common/utils/animate-css';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import createThrottledFunction from 'onedata-gui-common/utils/create-throttled-function';
import $ from 'jquery';
import removeObjectsFirstOccurence from 'onedata-gui-common/utils/remove-objects-first-occurence';
import { resolve } from 'rsvp';

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
  'btnDownload',
  'btnDownloadTarGz',
  'btnShare',
  'btnMetadata',
  'btnPermissions',
  'btnDistribution',
  'btnQos',
  'btnRename',
  'btnCreateSymlink',
  'btnCreateHardlink',
  'btnPlaceSymlink',
  'btnPlaceHardlink',
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
  isMobile: service(),

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
   * One of: move, copy, link
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
   * @type {ComputedProperty<boolean>}
   */
  selectedFilesContainsOnlySymlinks: computed(
    'selectedFiles.[]',
    function selectedFilesContainsOnlySymlinks() {
      const selectedFiles = this.get('selectedFiles');
      return selectedFiles.length && selectedFiles.isEvery('type', 'symlink');
    }
  ),

  /**
   * @type {ComputedProperty<boolean>}
   */
  selectedFilesContainsOnlyBrokenSymlinks: computed(
    'selectedFilesContainsOnlySymlinks',
    'selectedFiles.[]',
    function selectedFilesContainsOnlyBrokenSymlinks() {
      const {
        selectedFiles,
        selectedFilesContainsOnlySymlinks,
      } = this.getProperties('selectedFiles', 'selectedFilesContainsOnlySymlinks');
      return selectedFilesContainsOnlySymlinks &&
        selectedFiles.filterBy('linkedFile').length === 0;
    }
  ),

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
    'fileClipboardMode',
    'previewMode',
    function menuButtons() {
      if (this.get('dir.isShareRoot')) {
        return [];
      } else {
        const {
          allButtonsArray,
          isRootDir,
          fileClipboardMode,
          previewMode,
        } = this.getProperties(
          'allButtonsArray',
          'isRootDir',
          'fileClipboardMode',
          'previewMode',
        );
        const context = (isRootDir ? 'spaceRootDir' : 'currentDir') +
          (previewMode ? 'Preview' : '');
        let importedActions = getButtonActions(
          allButtonsArray,
          context
        );
        if (fileClipboardMode !== 'symlink') {
          importedActions = importedActions.rejectBy('id', 'placeSymlink');
        }
        if (fileClipboardMode !== 'hardlink') {
          importedActions = importedActions.rejectBy('id', 'placeHardlink');
        }
        if (fileClipboardMode !== 'copy' && fileClipboardMode !== 'move') {
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

  btnShare: computed(
    'spacePrivileges.view',
    'openShare',
    'selectedFilesContainsOnlySymlinks',
    function btnShare() {
      const {
        spacePrivileges,
        openShare,
        i18n,
        selectedFilesContainsOnlySymlinks,
      } = this.getProperties(
        'spacePrivileges',
        'openShare',
        'i18n',
        'selectedFilesContainsOnlySymlinks'
      );
      const canView = get(spacePrivileges, 'view');
      const disabled = selectedFilesContainsOnlySymlinks || !canView;
      let tip;
      if (selectedFilesContainsOnlySymlinks) {
        tip = this.t('featureNotForSymlinks');
      } else if (!canView) {
        tip = insufficientPrivilegesMessage({
          i18n,
          modelName: 'space',
          privilegeFlag: 'space_view',
        });
      }
      return this.createFileAction({
        id: 'share',
        action: (files) => {
          return openShare(files.rejectBy('type', 'symlink')[0]);
        },
        disabled,
        tip,
        showIn: [
          actionContext.singleFile,
          actionContext.singleDir,
          actionContext.currentDir,
          actionContext.spaceRootDir,
        ],
      });
    }
  ),

  btnMetadata: computed('selectedFilesContainsOnlySymlinks', function btnMetadata() {
    const selectedFilesContainsOnlySymlinks =
      this.get('selectedFilesContainsOnlySymlinks');
    return this.createFileAction({
      id: 'metadata',
      disabled: selectedFilesContainsOnlySymlinks,
      tip: selectedFilesContainsOnlySymlinks ?
        this.t('featureNotForSymlinks') : undefined,
      action: (files) => {
        return this.get('openMetadata')(files.rejectBy('type', 'symlink')[0]);
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

  btnDownload: computed(
    'selectedFilesContainsOnlyBrokenSymlinks',
    function btnDownload() {
      return this.createFileAction({
        id: 'download',
        icon: 'browser-download',
        disabled: this.get('selectedFilesContainsOnlyBrokenSymlinks'),
        action: (files) => {
          return this.downloadFiles(files);
        },
        showIn: [
          actionContext.singleFile,
          actionContext.singleFilePreview,
        ],
      });
    }
  ),

  btnDownloadTarGz: computed(
    'selectedFilesContainsOnlyBrokenSymlinks',
    function btnInfo() {
      return this.createFileAction({
        id: 'downloadTarGz',
        icon: 'browser-download',
        disabled: this.get('selectedFilesContainsOnlyBrokenSymlinks'),
        action: (files) => {
          return this.downloadFiles(files);
        },
        showIn: [
          actionContext.spaceRootDir,
          actionContext.spaceRootDirPreview,
          actionContext.currentDir,
          actionContext.currentDirPreview,
          actionContext.singleDir,
          actionContext.singleDirPreview,
          actionContext.multiFile,
          actionContext.multiFilePreview,
          actionContext.multiDir,
          actionContext.mutliDirPreview,
          actionContext.multiMixed,
          actionContext.multiMixedPreview,
        ],
      });
    }
  ),

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

  btnPermissions: computed(
    'selectedFilesContainsOnlySymlinks',
    function btnPermissions() {
      const {
        selectedFilesContainsOnlySymlinks,
        openEditPermissions,
      } = this.getProperties(
        'selectedFilesContainsOnlySymlinks',
        'openEditPermissions'
      );
      return this.createFileAction({
        id: 'permissions',
        disabled: selectedFilesContainsOnlySymlinks,
        tip: selectedFilesContainsOnlySymlinks ?
          this.t('featureNotForSymlinks') : undefined,
        action: (files) => {
          return openEditPermissions(files.rejectBy('type', 'symlink'));
        },
        showIn: [
          ...anySelected,
          actionContext.currentDir,
        ],
      });
    }
  ),

  btnCreateSymlink: computed('selectedFiles.length', function btnCreateSymlink() {
    const areManyFilesSelected = this.get('selectedFiles.length') > 1;
    return this.createFileAction({
      id: 'createSymlink',
      icon: 'shortcut',
      title: this.t(`fileActions.createSymlink${areManyFilesSelected ? 'Plural' : 'Singular'}`),
      action: (files) => {
        this.setProperties({
          fileClipboardFiles: files.slice(),
          fileClipboardMode: 'symlink',
        });
      },
      showIn: anySelected,
    });
  }),

  btnCreateHardlink: computed(
    'selectedFiles.[]',
    'selectedFilesContainsOnlySymlinks',
    function btnCreateHardlink() {
      const selectedFilesContainsOnlySymlinks = this.get('selectedFilesContainsOnlySymlinks');
      const areManyFilesSelected = this.get('selectedFiles.length') > 1;
      const hasDirectorySelected = this.get('selectedFiles').isAny('type', 'dir');
      const disabled = selectedFilesContainsOnlySymlinks || hasDirectorySelected;
      let tip;
      if (selectedFilesContainsOnlySymlinks) {
        tip = this.t('featureNotForSymlinks');
      } else if (hasDirectorySelected) {
        tip = this.t('cannotHardlinkDirectory');
      }
      return this.createFileAction({
        id: 'createHardlink',
        icon: 'text-link',
        disabled,
        tip,
        title: this.t(`fileActions.createHardlink${areManyFilesSelected ? 'Plural' : 'Singular'}`),
        action: (files) => {
          this.setProperties({
            fileClipboardFiles: files.rejectBy('type', 'symlink'),
            fileClipboardMode: 'hardlink',
          });
        },
        showIn: anySelected,
      });
    }
  ),

  btnPlaceSymlink: computed(function btnPlaceSymlink() {
    return this.createFileAction({
      id: 'placeSymlink',
      icon: 'shortcut',
      action: () => this.placeSymlinks(),
      showIn: [
        actionContext.currentDir,
        actionContext.spaceRootDir,
        actionContext.inDir,
      ],
    });
  }),

  btnPlaceHardlink: computed(
    'fileClipboardFiles.[]',
    function btnPlaceHardlink() {
      return this.createFileAction({
        id: 'placeHardlink',
        icon: 'text-link',
        action: () => this.placeHardlinks(),
        showIn: [
          actionContext.currentDir,
          actionContext.spaceRootDir,
          actionContext.inDir,
        ],
      });
    }
  ),

  btnCopy: computed('selectedFilesContainsOnlySymlinks', function btnCopy() {
    const selectedFilesContainsOnlySymlinks = this.get('selectedFilesContainsOnlySymlinks');
    return this.createFileAction({
      id: 'copy',
      disabled: selectedFilesContainsOnlySymlinks,
      tip: selectedFilesContainsOnlySymlinks ?
        this.t('featureNotForSymlinks') : undefined,
      action: (files) => {
        this.setProperties({
          fileClipboardFiles: files.rejectBy('type', 'symlink'),
          fileClipboardMode: 'copy',
        });
      },
      showIn: anySelected,
    });
  }),

  btnCut: computed('selectedFilesContainsOnlySymlinks', function btnCut() {
    const selectedFilesContainsOnlySymlinks = this.get('selectedFilesContainsOnlySymlinks');
    return this.createFileAction({
      id: 'cut',
      disabled: selectedFilesContainsOnlySymlinks,
      tip: selectedFilesContainsOnlySymlinks ?
        this.t('featureNotForSymlinks') : undefined,
      action: (files) => {
        this.setProperties({
          fileClipboardFiles: files.rejectBy('type', 'symlink'),
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

  btnDistribution: computed(
    'selectedFilesContainsOnlySymlinks',
    function btnDistribution() {
      const {
        selectedFilesContainsOnlySymlinks,
        openFileDistributionModal,
      } = this.getProperties(
        'selectedFilesContainsOnlySymlinks',
        'openFileDistributionModal'
      );
      return this.createFileAction({
        id: 'distribution',
        disabled: selectedFilesContainsOnlySymlinks,
        tip: selectedFilesContainsOnlySymlinks ?
          this.t('featureNotForSymlinks') : undefined,
        showIn: [
          ...anySelected,
          actionContext.currentDir,
          actionContext.spaceRootDir,
        ],
        action: (files) => {
          return openFileDistributionModal(files.rejectBy('type', 'symlink'));
        },
      });
    }
  ),

  btnQos: computed(
    'spacePrivileges.{viewQos,manageQos}',
    'openQos',
    'selectedFilesContainsOnlySymlinks',
    function btnQos() {
      const {
        spacePrivileges,
        openQos,
        i18n,
        selectedFilesContainsOnlySymlinks,
      } = this.getProperties(
        'spacePrivileges',
        'openQos',
        'i18n',
        'selectedFilesContainsOnlySymlinks'
      );
      const canView = get(spacePrivileges, 'viewQos');
      const disabled = selectedFilesContainsOnlySymlinks || !canView;
      let tip;
      if (selectedFilesContainsOnlySymlinks) {
        tip = this.t('featureNotForSymlinks');
      } else if (!canView) {
        tip = insufficientPrivilegesMessage({
          i18n,
          modelName: 'space',
          privilegeFlag: 'space_view_qos',
        });
      }
      return this.createFileAction({
        id: 'qos',
        icon: 'qos',
        showIn: [
          ...anySelected,
          actionContext.currentDir,
          actionContext.spaceRootDir,
        ],
        disabled,
        tip,
        action: (files) => {
          return openQos(files.rejectBy('type', 'symlink'));
        },
      });
    }
  ),

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

  init() {
    this._super(...arguments);
    this.set('loadingIconFileIds', A());
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

  async placeHardlinks() {
    const {
      dir,
      fileManager,
      globalNotify,
      errorExtractor,
      i18n,
      i18nPrefix,
      fileClipboardFiles,
    } = this.getProperties(
      'dir',
      'fileManager',
      'globalNotify',
      'errorExtractor',
      'i18n',
      'i18nPrefix',
      'fileClipboardFiles'
    );

    const throttledRefresh = createThrottledFunction(
      () => this.get('fbTableApi.refresh')(),
      1000
    );

    return handleMultiFilesOperation({
        files: fileClipboardFiles,
        globalNotify,
        errorExtractor,
        i18n,
        operationErrorKey: `${i18nPrefix}.linkFailed`,
      },
      async (file) => {
        await fileManager.createHardlink(get(file, 'index'), dir, file);
        await throttledRefresh();
      }
    );
  },

  async placeSymlinks() {
    const {
      dir,
      fileManager,
      globalNotify,
      errorExtractor,
      i18n,
      i18nPrefix,
      fileClipboardFiles,
      spaceId,
    } = this.getProperties(
      'dir',
      'fileManager',
      'globalNotify',
      'errorExtractor',
      'i18n',
      'i18nPrefix',
      'fileClipboardFiles',
      'spaceId'
    );

    const throttledRefresh = createThrottledFunction(
      () => this.get('fbTableApi.refresh')(),
      1000
    );

    return handleMultiFilesOperation({
      files: fileClipboardFiles,
      globalNotify,
      errorExtractor,
      i18n,
      operationErrorKey: `${i18nPrefix}.linkFailed`,
    }, async (file) => {
      const fileName = get(file, 'index');
      const filePath = stringifyFilePath(await resolveFilePath(file), 'index');
      await fileManager.createSymlink(fileName, dir, filePath, spaceId);
      await throttledRefresh();
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

  downloadFiles(files) {
    const {
      fileManager,
      globalNotify,
      previewMode,
      loadingIconFileIds,
    } = this.getProperties(
      'fileManager',
      'globalNotify',
      'previewMode',
      'loadingIconFileIds'
    );
    const effFiles = files.mapBy('effFile').compact();
    if (!effFiles.length) {
      return resolve();
    }

    const fileIds = effFiles.mapBy('entityId');
    // intentionally not checking for duplicates, because we treat multiple "loading id"
    // entries as semaphores
    loadingIconFileIds.pushObjects(fileIds);
    return fileManager.getFileDownloadUrl(
        fileIds,
        previewMode ? 'public' : 'private'
      )
      .then((data) => this.handleFileDownloadUrl(data))
      .catch((error) => {
        globalNotify.backendError(this.t('startingDownload'), error);
        throw error;
      })
      .finally(() => {
        removeObjectsFirstOccurence(loadingIconFileIds, fileIds);
      });
  },

  handleFileDownloadUrl(data) {
    const isMobileBrowser = this.get('isMobile.any');
    const fileUrl = data && get(data, 'fileUrl');
    if (fileUrl) {
      if (isMobileBrowser) {
        this.downloadUsingOpen(fileUrl);
      } else {
        this.downloadUsingIframe(fileUrl);
      }
    } else {
      throw { isOnedataCustomError: true, type: 'empty-file-url' };
    }
  },

  downloadUsingIframe(fileUrl) {
    const _body = this.get('_body');
    const iframe = $('<iframe/>').attr({
      src: fileUrl,
      style: 'display:none;',
    }).appendTo(_body);
    // the time should be long to support some download extensions in Firefox desktop
    later(() => iframe.remove(), 60000);
  },

  downloadUsingOpen(fileUrl) {
    // Apple devices such as iPad tries to open file using its embedded viewer
    // in any browser, but we cannot say if the file extension is currently supported
    // so we try to open every file in new tab.
    const target = this.get('isMobile.apple.device') ? '_blank' : '_self';
    this.get('_window').open(fileUrl, target);
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
