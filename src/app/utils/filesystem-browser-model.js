/**
 * Implementation of browser-model (logic and co-related data) for filesystem-browser
 * (a browser for mananging files and directories).
 *
 * @module utils/filesystem-browser-model
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { inject as service } from '@ember/service';
import handleMultiFilesOperation from 'oneprovider-gui/utils/handle-multi-files-operation';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import createThrottledFunction from 'onedata-gui-common/utils/create-throttled-function';
import removeObjectsFirstOccurence from 'onedata-gui-common/utils/remove-objects-first-occurence';
import { resolve } from 'rsvp';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { later } from '@ember/runloop';
import $ from 'jquery';
import { computed, get } from '@ember/object';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import BaseBrowserModel from 'oneprovider-gui/utils/base-browser-model';
import {
  actionContext,
  anySelectedContexts,
} from 'oneprovider-gui/components/file-browser';
import { hash, array, raw } from 'ember-awesome-macros';

const buttonNames = Object.freeze([
  'btnUpload',
  'btnNewDirectory',
  'btnRefresh',
  'btnInfo',
  'btnDownload',
  'btnDownloadTar',
  'btnShare',
  'btnDatasets',
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
]);

export default BaseBrowserModel.extend({
  errorExtractor: service(),
  fileManager: service(),
  globalNotify: service(),
  i18n: service(),
  isMobile: service(),
  uploadManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.filesystemBrowserModel',

  /**
   * @virtual
   * @type {Function}
   * @param {Models.File} file file to show its info
   */
  openInfo: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   * @param {Models.File} file file to edit its metadata
   */
  openMetadata: notImplementedThrow,

  /**
   * @virtual optional: only in non-preview mode
   * @type {Function}
   * @param {Models.File} file parent of new directory
   */
  openCreateNewDirectory: notImplementedThrow,

  /**
   * @virtual optional: only in non-preview mode
   * @type {Function}
   * @param {Array<Models.File>} files array with files/directories to remove
   */
  openRemove: notImplementedThrow,

  /**
   * @virtual optional: only in non-preview mode
   * @type {Function}
   * @param {Models.File} file file to rename
   * @param {Models.File} parentDir parentDir of file to rename
   */
  openRename: notImplementedThrow,

  /**
   * @virtual optional: only in non-preview mode
   * @type {Function}
   * @param {Array<Models.File>} files files to edit permissions
   */
  openEditPermissions: notImplementedThrow,

  /**
   * @virtual optional: only in non-preview mode
   * @type {Function}
   * @param {Array<Models.File>} files files to show distribution
   */
  openFileDistribution: notImplementedThrow,

  /**
   * @virtual optional: only in non-preview mode
   * @type {Function}
   * @param {Array<Models.File>} files files to configure QoS
   */
  openQos: notImplementedThrow,

  /**
   * @virtual optional: only in non-preview mode
   * @type {Function}
   * @param {Models.File} file file to share
   */
  openShare: notImplementedThrow,

  /**
   * @virtual optional: only in non-preview mode
   * @type {Function}
   * @param {Array<Models.File>} files files to browse and edit their dataset settings
   */
  openDatasets: notImplementedThrow,

  /**
   * @override
   */
  rowComponentName: 'filesystem-browser/table-row',

  /**
   * @override
   */
  statusBarComponentName: 'filesystem-browser/table-row-status-bar',

  /**
   * @override
   */
  mobileInfoComponentName: 'filesystem-browser/table-row-mobile-info',

  /**
   * @override
   */
  columnsComponentName: 'filesystem-browser/table-row-columns',

  /**
   * @override
   */
  headRowComponentName: 'filesystem-browser/table-head-row',

  /**
   * @override
   */
  emptyDirComponentName: 'filesystem-browser/empty-dir',

  /**
   * @override
   */
  browserClass: 'filesystem-browser',

  /**
   * @override
   */
  buttonNames: buttonNames,

  /**
   * Reference to Document object - can be stubbed for testing purposes.
   * @type {Document}
   */
  _document: document,

  /**
   * Reference to Body object - can be stubbed for testing purposes.
   * @type {HTMLBodyElement}
   */
  _body: document.body,

  /**
   * @override
   */
  allButtonsHash: hash(...buttonNames),

  // #region Action buttons

  btnUpload: computed(
    'dir.dataIsProtected',
    function btnUpload() {
      const uploadManager = this.get('uploadManager');
      const actionId = 'upload';
      const tip = this.generateDisabledTip({
        protectionType: 'data',
        checkProtectionForCurrentDir: true,
        checkProtectionForSelected: false,
      });
      const disabled = Boolean(tip);
      return this.createFileAction({
        id: actionId,
        class: 'browser-upload',
        action: () => uploadManager.triggerUploadDialog(),
        disabled,
        tip,
        showIn: [
          actionContext.inDir,
          actionContext.currentDir,
          actionContext.spaceRootDir,
        ],
      });
    }
  ),

  btnNewDirectory: computed(
    'dir.dataIsProtected',
    function btnNewDirectory() {
      const actionId = 'newDirectory';
      const tip = this.generateDisabledTip({
        protectionType: 'data',
        checkProtectionForCurrentDir: true,
        checkProtectionForSelected: false,
      });
      const disabled = Boolean(tip);
      return this.createFileAction({
        id: actionId,
        action: () => {
          const {
            openCreateNewDirectory,
            dir,
          } = this.getProperties('openCreateNewDirectory', 'dir');
          openCreateNewDirectory(dir);
        },
        tip,
        disabled,
        showIn: [
          actionContext.inDir,
          actionContext.currentDir,
          actionContext.spaceRootDir,
        ],
      });
    }
  ),

  btnShare: computed(
    'spacePrivileges.view',
    'openShare',
    'selectedFilesContainsOnlySymlinks',
    function btnShare() {
      const {
        spacePrivileges,
        openShare,
        i18n,
      } = this.getProperties(
        'spacePrivileges',
        'openShare',
        'i18n',
      );
      let disabledTip = this.generateDisabledTip({
        blockWhenSymlinksOnly: true,
      });
      const canView = get(spacePrivileges, 'view');
      if (!canView && !disabledTip) {
        disabledTip = insufficientPrivilegesMessage({
          i18n,
          modelName: 'space',
          privilegeFlag: 'space_view',
        });
      }
      return this.createFileAction({
        id: 'share',
        action: (files) => {
          return openShare(files[0]);
        },
        disabled: Boolean(disabledTip),
        tip: disabledTip,
        showIn: [
          actionContext.singleFile,
          actionContext.singleDir,
          actionContext.currentDir,
          actionContext.spaceRootDir,
        ],
      });
    }
  ),

  btnDatasets: computed(
    'spacePrivileges.view',
    'selectedFilesContainsOnlySymlinks',
    function btnDatasets() {
      const {
        spacePrivileges,
        openDatasets,
        i18n,
      } = this.getProperties('spacePrivileges', 'openDatasets', 'i18n');
      let disabledTip = this.generateDisabledTip({
        blockWhenSymlinksOnly: true,
      });
      const canView = get(spacePrivileges, 'view');
      if (!canView && !disabledTip) {
        disabledTip = insufficientPrivilegesMessage({
          i18n,
          modelName: 'space',
          privilegeFlag: 'space_view',
        });
      }
      const disabled = Boolean(disabledTip);
      return this.createFileAction({
        id: 'datasets',
        icon: 'browser-dataset',
        action: (files) => {
          return openDatasets(files);
        },
        disabled,
        tip: disabledTip,
        showIn: [
          actionContext.singleDir,
          actionContext.singleFile,
          actionContext.currentDir,
          actionContext.spaceRootDir,
        ],
      });
    }
  ),

  btnMetadata: computed('selectedFilesContainsOnlySymlinks', function btnMetadata() {
    const disabledTip = this.generateDisabledTip({
      blockWhenSymlinksOnly: true,
    });
    return this.createFileAction({
      id: 'metadata',
      disabled: Boolean(disabledTip),
      tip: disabledTip,
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
      action: (files, activeTab) => {
        return this.get('openInfo')(files[0], activeTab);
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

  btnDownloadTar: computed(
    'selectedFilesContainsOnlyBrokenSymlinks',
    function btnDownloadTar() {
      return this.createFileAction({
        id: 'downloadTar',
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

  btnRename: computed('selectedFiles.@each.dataIsProtected', function btnRename() {
    const actionId = 'rename';
    const tip = this.generateDisabledTip({
      protectionType: 'data',
    });
    const disabled = Boolean(tip);
    return this.createFileAction({
      id: actionId,
      action: (files) => {
        const {
          openRename,
          dir,
        } = this.getProperties('openRename', 'dir');
        return openRename(files[0], dir);
      },
      disabled,
      tip,
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
      const disabledTip = this.generateDisabledTip({
        blockWhenSymlinksOnly: true,
      });
      return this.createFileAction({
        id: 'permissions',
        disabled: Boolean(disabledTip),
        tip: disabledTip,
        action: (files) => {
          return this.get('openEditPermissions')(files.rejectBy('type', 'symlink'));
        },
        showIn: [
          ...anySelectedContexts,
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
      title: this.t(
        `fileActions.createSymlink${areManyFilesSelected ? 'Plural' : 'Singular'}`
      ),
      action: (files) => {
        const browserInstance = this.get('browserInstance');
        browserInstance.setFileClipboardFiles(files.slice());
        browserInstance.setFileClipboardMode('symlink');
      },
      showIn: anySelectedContexts,
    });
  }),

  btnCreateHardlink: computed(
    'selectedFiles.[]',
    'selectedFilesContainsOnlySymlinks',
    function btnCreateHardlink() {
      const areManyFilesSelected = this.get('selectedFiles.length') > 1;
      const disabledTip = this.generateDisabledTip({
        blockWhenSymlinksOnly: true,
        blockFileTypes: ['dir'],
      });
      return this.createFileAction({
        id: 'createHardlink',
        icon: 'text-link',
        disabled: Boolean(disabledTip),
        tip: disabledTip,
        title: this.t(
          `fileActions.createHardlink${areManyFilesSelected ? 'Plural' : 'Singular'}`
        ),
        action: (files) => {
          const browserInstance = this.get('browserInstance');
          browserInstance.setFileClipboardFiles(files.rejectBy('type', 'symlink'));
          browserInstance.setFileClipboardMode('hardlink');
        },
        showIn: anySelectedContexts,
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
    const disabledTip = this.generateDisabledTip({
      blockWhenSymlinksOnly: true,
    });
    return this.createFileAction({
      id: 'copy',
      disabled: Boolean(disabledTip),
      tip: disabledTip,
      action: (files) => {
        const browserInstance = this.get('browserInstance');
        browserInstance.setFileClipboardFiles(files.rejectBy('type', 'symlink'));
        browserInstance.setFileClipboardMode('copy');
      },
      showIn: anySelectedContexts,
    });
  }),

  btnCut: computed(
    'selectedFilesContainsOnlySymlinks',
    'selectedFiles.@each.dataIsProtected',
    function btnCut() {
      const actionId = 'cut';
      const tip = this.generateDisabledTip({
        protectionType: 'data',
        blockWhenSymlinksOnly: true,
      });
      const disabled = Boolean(tip);
      return this.createFileAction({
        id: actionId,
        action: (files) => {
          const browserInstance = this.get('browserInstance');
          browserInstance.setFileClipboardFiles(files.rejectBy('type', 'symlink'));
          browserInstance.setFileClipboardMode('move');
        },
        disabled,
        tip,
        showIn: anySelectedContexts,
      });
    }
  ),

  btnPaste: computed(
    'dir.dataIsProtected',
    function btnPaste() {
      const actionId = 'paste';
      const tip = this.generateDisabledTip({
        protectionType: 'data',
        checkProtectionForCurrentDir: true,
        checkProtectionForSelected: false,
      });
      const disabled = Boolean(tip);
      return this.createFileAction({
        id: actionId,
        action: () => this.pasteFiles(),
        disabled,
        tip,
        showIn: [
          actionContext.currentDir,
          actionContext.spaceRootDir,
          actionContext.inDir,
        ],
      });
    }
  ),

  btnDelete: computed('selectedFiles.@each.dataIsProtected', function btnDelete() {
    const actionId = 'delete';
    const tip = this.generateDisabledTip({
      protectionType: 'data',
    });
    const disabled = Boolean(tip);
    return this.createFileAction({
      id: actionId,
      action: (files) => {
        const {
          openRemove,
          dir,
        } = this.getProperties('openRemove', 'dir');
        return openRemove(files, dir);
      },
      disabled,
      tip,
      showIn: anySelectedContexts,
    });
  }),

  btnDistribution: computed(
    'selectedFilesContainsOnlySymlinks',
    function btnDistribution() {
      const disabledTip = this.generateDisabledTip({
        blockWhenSymlinksOnly: true,
      });
      return this.createFileAction({
        id: 'distribution',
        disabled: Boolean(disabledTip),
        tip: disabledTip,
        showIn: [
          ...anySelectedContexts,
          actionContext.currentDir,
          actionContext.spaceRootDir,
        ],
        action: (files) => {
          return this.get('openFileDistribution')(files.rejectBy('type', 'symlink'));
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
      } = this.getProperties(
        'spacePrivileges',
        'openQos',
        'i18n',
      );
      const canView = get(spacePrivileges, 'viewQos');
      let disabledTip = this.generateDisabledTip({
        blockWhenSymlinksOnly: true,
      });
      if (!canView && !disabledTip) {
        disabledTip = insufficientPrivilegesMessage({
          i18n,
          modelName: 'space',
          privilegeFlag: 'space_view_qos',
        });
      }
      return this.createFileAction({
        id: 'qos',
        icon: 'qos',
        showIn: [
          ...anySelectedContexts,
          actionContext.currentDir,
          actionContext.spaceRootDir,
        ],
        disabled: Boolean(disabledTip),
        tip: disabledTip,
        action: (files) => {
          return openQos(files.rejectBy('type', 'symlink'));
        },
      });
    }
  ),

  // #endregion

  /**
   * @type {ComputedProperty<boolean>}
   */
  selectedFilesContainsOnlySymlinks: computed(
    'selectedFiles.[]',
    function selectedFilesContainsOnlySymlinks() {
      const selectedFiles = this.get('selectedFiles');
      return selectedFiles &&
        get(selectedFiles, 'length') &&
        selectedFiles.isEvery('type', 'symlink');
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
        selectedFiles.filterBy('effFile').length === 0;
    }
  ),

  uploadAction: array.findBy('allButtonsArray', raw('id'), raw('upload')),

  newDirectoryAction: array.findBy('allButtonsArray', raw('id'), raw('newDirectory')),

  placeSymlinkAction: array.findBy('allButtonsArray', raw('id'), raw('placeSymlink')),

  placeHardlinkAction: array.findBy('allButtonsArray', raw('id'), raw('placeHardlink')),

  pasteAction: array.findBy('allButtonsArray', raw('id'), raw('paste')),

  /**
   * @override
   */
  onChangeDir(dir) {
    this.get('uploadManager').changeTargetDirectory(dir);
  },

  /**
   * @override
   */
  onInsertElement() {
    const {
      _document,
      element,
      uploadManager,
      dir,
    } = this.getProperties('_document', 'element', 'uploadManager', 'dir');

    const uploadDropElement = element.parentElement;
    uploadManager.assignUploadDrop(uploadDropElement);
    const uploadBrowseElement = _document.querySelector('.fb-upload-trigger');
    uploadManager.assignUploadBrowse(uploadBrowseElement);
    uploadManager.changeTargetDirectory(dir);
  },

  /**
   * @override
   */
  onOpenFile(file) {
    this.downloadFiles([file]);
  },

  /**
   * @override
   */
  getCurrentDirMenuButtons(availableActions) {
    if (this.get('dir.isShareRoot')) {
      return [];
    }

    const fileClipboardMode = this.get('fileClipboardMode');
    let actions = [...availableActions];
    if (fileClipboardMode !== 'symlink') {
      actions = actions.rejectBy('id', 'placeSymlink');
    }
    if (fileClipboardMode !== 'hardlink') {
      actions = actions.rejectBy('id', 'placeHardlink');
    }
    if (fileClipboardMode !== 'copy' && fileClipboardMode !== 'move') {
      actions = actions.rejectBy('id', 'paste');
    }
    return actions;
  },

  generateDisabledTip({
    protectionType,
    checkProtectionForCurrentDir = false,
    checkProtectionForSelected = true,
    blockFileTypes = [],
    blockWhenSymlinksOnly = false,
  }) {
    const {
      dir,
      selectedFiles,
      selectedFilesContainsOnlySymlinks,
    } = this.getProperties('dir', 'selectedFiles', 'selectedFilesContainsOnlySymlinks');
    let tip;
    if (!tip && protectionType) {
      const protectionProperty = `${protectionType}IsProtected`;
      const isProtected = checkProtectionForCurrentDir && get(dir, protectionProperty) ||
        checkProtectionForSelected && selectedFiles.isAny(protectionProperty);
      tip = isProtected ? this.t('disabledActionReason.writeProtected', {
        protectionType: this.t(`disabledActionReason.protectionType.${protectionType}`),
      }) : undefined;
    }
    if (!tip && blockFileTypes.length) {
      if (selectedFiles.any(file => blockFileTypes.includes(get(file, 'type')))) {
        tip = this.t('disabledActionReason.blockedFileType', {
          fileType: blockFileTypes.map(fileType =>
            this.t(`disabledActionReason.fileTypesPlural.${fileType}`)
          ).join(` ${this.t('disabledActionReason.and')} `),
        });
      }
    }
    if (!tip && blockWhenSymlinksOnly && selectedFilesContainsOnlySymlinks) {
      tip = this.t('disabledActionReason.blockedFileType', {
        fileType: this.t('disabledActionReason.fileTypesPlural.symlink'),
      });
    }
    return tip;
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

  pasteFiles() {
    const {
      dir,
      fileManager,
      globalNotify,
      errorExtractor,
      i18n,
      i18nPrefix,
      browserInstance,
    } = this.getProperties(
      'dir',
      'fileManager',
      'globalNotify',
      'errorExtractor',
      'i18n',
      'i18nPrefix',
      'browserInstance',
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
        browserInstance.clearFileClipboard();
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
      fbTableApi,
    } = this.getProperties(
      'dir',
      'fileManager',
      'globalNotify',
      'errorExtractor',
      'i18n',
      'i18nPrefix',
      'fileClipboardFiles',
      'fbTableApi'
    );

    const throttledRefresh = createThrottledFunction(
      () => fbTableApi.refresh(),
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
        await fileManager.createHardlink(get(file, 'index'), dir, file, 50);
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
      fbTableApi,
    } = this.getProperties(
      'dir',
      'fileManager',
      'globalNotify',
      'errorExtractor',
      'i18n',
      'i18nPrefix',
      'fileClipboardFiles',
      'spaceId',
      'fbTableApi',
    );

    const throttledRefresh = createThrottledFunction(
      () => fbTableApi.refresh(),
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
      await fileManager.createSymlink(fileName, dir, filePath, spaceId, 50);
      await throttledRefresh();
    });
  },

  emptyDirUpload() {
    return this.get('uploadAction.action')(...arguments);
  },

  emptyDirNewDirectory() {
    return this.get('newDirectoryAction.action')(...arguments);
  },

  emptyDirPlaceSymlink() {
    return this.get('placeSymlinkAction.action')(...arguments);
  },

  emptyDirPlaceHardlink() {
    return this.get('placeHardlinkAction.action')(...arguments);
  },

  emptyDirPaste() {
    return this.get('pasteAction.action')(...arguments);
  },
});
