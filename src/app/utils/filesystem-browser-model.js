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
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { computed, get, observer } from '@ember/object';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import BaseBrowserModel from 'oneprovider-gui/utils/base-browser-model';
import {
  actionContext,
  anySelectedContexts,
} from 'oneprovider-gui/components/file-browser';
import DownloadInBrowser from 'oneprovider-gui/mixins/download-in-browser';
import recordIcon from 'onedata-gui-common/utils/record-icon';
import { array, raw, and } from 'ember-awesome-macros';
import { defaultFilesystemFeatures } from 'oneprovider-gui/components/filesystem-browser/file-features';

const buttonNames = Object.freeze([
  'btnBagitUpload',
  'btnUpload',
  'btnNewDirectory',
  'btnRefresh',
  'btnInfo',
  'btnRecallInfo',
  'btnDownload',
  'btnDownloadTar',
  'btnShare',
  'btnDatasets',
  'btnMetadata',
  'btnPermissions',
  'btnDistribution',
  'btnQos',
  'btnRunWorkflow',
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

export default BaseBrowserModel.extend(DownloadInBrowser, {
  errorExtractor: service(),
  fileManager: service(),
  globalNotify: service(),
  isMobile: service(),
  uploadManager: service(),
  workflowManager: service(),
  modalManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.filesystemBrowserModel',

  /**
   * @virtual
   * @type {Function}
   */
  openBagitUploader: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   * @param {Models.File} file file to show its info
   */
  openInfo: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   * @param {Models.File} file file to show recall state modal
   */
  openRecallInfo: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   * @param {Models.File} file file to edit its metadata
   */
  openMetadata: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   * @param {Array<Models.File>} file file to show in confirm download modal
   */
  openConfirmDownload: notImplementedThrow,

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
   * @virtual
   * @type {Function}
   * @param {string} options.atmWorkflowSchemaId
   * @param {RevisionNumber} options.atmWorkflowSchemaRevisionNumber
   * @param {Object} options.inputStoresData
   */
  openWorkflowRunView: notImplementedThrow,

  /**
   * File features displayed in status bar - see `component:file-browser/file-features`
   * `features` property.
   * @virtual optional
   * @type {Array<String>}
   */
  fileFeatures: defaultFilesystemFeatures,

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
  headStatusBarComponentName: 'filesystem-browser/table-head-status-bar',

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
  browserClass: array.join(
    array.concat(
      raw(['filesystem-browser']),
      'customClassNames',
    ),
    raw(' '),
  ),

  /**
   * @override
   */
  buttonNames,

  /**
   * @override
   */
  infoIconActionName: 'info',

  /**
   * Reference to Document object - can be stubbed for testing purposes.
   * @type {Document}
   */
  _document: document,

  /**
   * Used to inform various parts of component that files and directories data
   * and metadata cannot be modified (eg. upload, delete).
   * @type {Boolean}
   */
  readonlyFilesystem: false,

  /**
   * True if QoS tag in header is currenlty hovered.
   * @type {Boolean}
   */
  qosHeaderTagIsHovered: false,

  /**
   * True if dataset tag in header is currenlty hovered.
   * @type {Boolean}
   */
  datasetHeaderTagIsHovered: false,

  /**
   * True if recalling tag in header is currenlty hovered.
   * @type {Boolean}
   */
  recallingHeaderTagIsHovered: false,

  /**
   * Timeout ID for removing transition class for tags.
   * See `animateHighlight` observer.
   * @type {Number|null}
   */
  highlightAnimationTimeoutId: null,

  // #region Action buttons

  btnBagitUpload: computed(
    'spacePrivileges.scheduleAtmWorkflowExecutions',
    function btnBagitUpload() {
      const i18n = this.get('i18n');
      const canScheduleAtmWorkflowExecutions =
        this.get('spacePrivileges.scheduleAtmWorkflowExecutions');
      let disabledTip;
      if (!canScheduleAtmWorkflowExecutions) {
        disabledTip = insufficientPrivilegesMessage({
          i18n,
          modelName: 'space',
          privilegeFlag: 'space_schedule_atm_workflow_executions',
        });
      }
      return this.createFileAction({
        id: 'bagitUpload',
        class: 'browser-bagit-upload',
        icon: 'browser-archive-upload',
        disabled: Boolean(disabledTip),
        tip: disabledTip,
        action: () => this.get('openBagitUploader')(),
        showIn: [
          actionContext.inDir,
        ],
      });
    }
  ),

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
    'selectedItemsContainsOnlySymlinks',
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
    'selectedItemsContainsOnlySymlinks',
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

  btnMetadata: computed('selectedItemsContainsOnlySymlinks', function btnMetadata() {
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

  btnRecallInfo: computed(
    'showRecallInfoButton',
    function btnRecallInfo() {
      const hidden = !this.get('showRecallInfoButton');
      return this.createFileAction({
        id: 'recallInfo',
        icon: 'browser-archive-recall',
        action: (files, activeTab) => {
          return this.get('openRecallInfo')(files[0], activeTab);
        },
        hidden,
        showIn: [
          actionContext.spaceRootDir,
          actionContext.singleDir,
          actionContext.singleFile,
          actionContext.currentDir,
        ],
      });
    }
  ),

  btnDownload: computed(
    'selectedItemsContainsOnlyBrokenSymlinks',
    function btnDownload() {
      return this.createFileAction({
        id: 'download',
        icon: 'browser-download',
        disabled: this.get('selectedItemsContainsOnlyBrokenSymlinks'),
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
    'selectedItemsContainsOnlyBrokenSymlinks',
    function btnDownloadTar() {
      return this.createFileAction({
        id: 'downloadTar',
        icon: 'browser-download',
        disabled: this.get('selectedItemsContainsOnlyBrokenSymlinks'),
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

  btnRename: computed('selectedItems.@each.dataIsProtected', function btnRename() {
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
    'selectedItemsContainsOnlySymlinks',
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

  btnCreateSymlink: computed('selectedItems.length', function btnCreateSymlink() {
    const areManyFilesSelected = this.get('selectedItems.length') > 1;
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
    'selectedItems.[]',
    'selectedItemsContainsOnlySymlinks',
    function btnCreateHardlink() {
      const selectedItemsContainsOnlySymlinks =
        this.get('selectedItemsContainsOnlySymlinks');
      const areManyFilesSelected = this.get('selectedItems.length') > 1;
      const disabledTip = this.generateDisabledTip({
        blockFileTypes: ['dir'],
      });
      let tip;
      if (!disabledTip && selectedItemsContainsOnlySymlinks) {
        tip = this.t(
          `hardlinkCreatesNewSymlinkTip.${areManyFilesSelected ? 'plural' : 'single'}`
        );
      }
      return this.createFileAction({
        id: 'createHardlink',
        icon: 'text-link',
        disabled: Boolean(disabledTip),
        tip: disabledTip || tip,
        title: this.t(
          `fileActions.createHardlink${areManyFilesSelected ? 'Plural' : 'Singular'}`
        ),
        action: (files) => {
          const browserInstance = this.get('browserInstance');
          browserInstance.setFileClipboardFiles(files);
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

  btnCopy: computed('selectedItemsContainsOnlySymlinks', function btnCopy() {
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
    'selectedItemsContainsOnlySymlinks',
    'selectedItems.@each.dataIsProtected',
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

  btnDelete: computed('selectedItems.@each.dataIsProtected', function btnDelete() {
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
    'selectedItemsContainsOnlySymlinks',
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
    'selectedItemsContainsOnlySymlinks',
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

  btnRunWorkflow: computed(
    'spacePrivileges.scheduleAtmWorkflowExecutions',
    'workflowManager.isOpenfaasAvailable',
    'openWorkflowRunView',
    function btnRunWorkflow() {
      const {
        i18n,
        modalManager,
        openWorkflowRunView,
      } = this.getProperties('i18n', 'modalManager', 'openWorkflowRunView');
      const canScheduleAtmWorkflowExecutions =
        this.get('spacePrivileges.scheduleAtmWorkflowExecutions');
      const isOpenfaasAvailable = this.get('workflowManager.isOpenfaasAvailable');
      let disabledTip;
      if (!isOpenfaasAvailable) {
        disabledTip =
          this.t('disabledActionReason.cannotRunWorkflowOpenfaasNotAvailable');
      } else if (!canScheduleAtmWorkflowExecutions) {
        disabledTip = insufficientPrivilegesMessage({
          i18n,
          modelName: 'space',
          privilegeFlag: 'space_schedule_atm_workflow_executions',
        });
      }
      return this.createFileAction({
        id: 'runWorkflow',
        icon: recordIcon('atmWorkflowSchema'),
        showIn: [
          ...anySelectedContexts,
          actionContext.currentDir,
          actionContext.spaceRootDir,
        ],
        disabled: Boolean(disabledTip),
        tip: disabledTip,
        action: (files) => {
          modalManager.show('run-workflow-modal', {
            atmWorkflowInputDataSource: 'filesSelection',
            atmWorkflowInputData: [...files],
            runWorkflowCallback: (...args) => openWorkflowRunView(...args),
          });
        },
      });
    }
  ),

  // #endregion

  /**
   * @type {ComputedProperty<Array<String>>}
   */
  customClassNames: computed(
    'qosHeaderTagIsHovered',
    'datasetHeaderTagIsHovered',
    'recallingHeaderTagIsHovered',
    'highlightAnimationTimeoutId',
    function customClassNames() {
      const {
        qosHeaderTagIsHovered,
        datasetHeaderTagIsHovered,
        recallingHeaderTagIsHovered,
        highlightAnimationTimeoutId,
      } = this.getProperties(
        'qosHeaderTagIsHovered',
        'datasetHeaderTagIsHovered',
        'recallingHeaderTagIsHovered',
        'highlightAnimationTimeoutId'
      );
      const classes = [];
      if (qosHeaderTagIsHovered) {
        classes.push('highlight-inherited-qos');
      }
      if (datasetHeaderTagIsHovered) {
        classes.push('highlight-inherited-dataset');
      }
      if (recallingHeaderTagIsHovered) {
        classes.push('highlight-inherited-recalling');
      }
      if (classes.length) {
        classes.push('highlight-inherited', 'highlight-transition');
      } else if (highlightAnimationTimeoutId) {
        classes.push('highlight-transition');
      }
      return classes;
    }
  ),

  /**
   * @type {ComputedProperty<boolean>}
   */
  selectedItemsContainsOnlySymlinks: computed(
    'selectedItems.[]',
    function selectedItemsContainsOnlySymlinks() {
      const selectedItems = this.get('selectedItems');
      return selectedItems &&
        get(selectedItems, 'length') &&
        selectedItems.isEvery('type', 'symlink');
    }
  ),

  /**
   * @type {ComputedProperty<boolean>}
   */
  selectedItemsContainsOnlyBrokenSymlinks: computed(
    'selectedItemsContainsOnlySymlinks',
    'selectedItems.[]',
    function selectedItemsContainsOnlyBrokenSymlinks() {
      const {
        selectedItems,
        selectedItemsContainsOnlySymlinks,
      } = this.getProperties('selectedItems', 'selectedItemsContainsOnlySymlinks');
      return selectedItemsContainsOnlySymlinks &&
        selectedItems.filterBy('effFile').length === 0;
    }
  ),

  selectedItemIsRecallTarget: computed(
    'selectedItems.[]',
    function selectedItemIsRecallTarget() {
      const selectedItems = this.get('selectedItems');
      return selectedItems && selectedItems.length === 1 && (
        get(selectedItems[0], 'isRecalled') ||
        get(selectedItems[0], 'recallingMembership') === 'ancestor' ||
        get(selectedItems[0], 'recallingMembership') === 'direct'
      );
    }
  ),

  showRecallInfoButton: and('isMobile.any', 'selectedItemIsRecallTarget'),

  uploadDropElement: computed('element', function uploadDropElement() {
    const element = this.get('element');
    if (element) {
      return element.closest('.upload-drop-zone-container');
    }
  }),

  uploadBrowseElement: computed('element', function uploadBrowseElement() {
    const element = this.get('element');
    if (element) {
      return element.querySelector('.fb-upload-trigger');
    }
  }),

  onTagHoverChange: computed(function onTagHoverChange() {
    return this.changeTagHover.bind(this);
  }),

  animateHighlight: observer(
    'qosHeaderTagIsHovered',
    'datasetHeaderTagIsHovered',
    'recallingHeaderTagIsHovered',
    function animateHighlight() {
      const {
        qosHeaderTagIsHovered,
        datasetHeaderTagIsHovered,
        recallingHeaderTagIsHovered,
        highlightAnimationTimeoutId,
      } = this.getProperties(
        'qosHeaderTagIsHovered',
        'datasetHeaderTagIsHovered',
        'recallingHeaderTagIsHovered',
        'highlightAnimationTimeoutId');
      if (highlightAnimationTimeoutId) {
        this.set('highlightAnimationTimeoutId', null);
        window.clearTimeout(highlightAnimationTimeoutId);
      }
      if (
        !qosHeaderTagIsHovered &&
        !datasetHeaderTagIsHovered &&
        !recallingHeaderTagIsHovered
      ) {
        this.set(
          'highlightAnimationTimeoutId',
          // timeout time is slightly longer than defined transition time in
          // file-status-bar.scss
          window.setTimeout(() => {
            this.set('highlightAnimationTimeoutId', null);
          }, 101)
        );
      }
    }
  ),

  /**
   * @override
   */
  onChangeDir(dir) {
    // TODO: VFS-7961 after modification of uploadManager global state, there should be revert
    // if using selector inside filesystem browser
    this.get('uploadManager').changeTargetDirectory(dir);
  },

  /**
   * @override
   */
  onInsertElement() {
    const {
      readonlyFilesystem,
      uploadManager,
      uploadDropElement,
      uploadBrowseElement,
      dir,
    } = this.getProperties(
      'readonlyFilesystem',
      'uploadManager',
      'uploadDropElement',
      'uploadBrowseElement',
      'dir'
    );

    if (!readonlyFilesystem) {
      // TODO: VFS-7961 after modification of uploadManager global state, there should be revert
      // if using selector inside filesystem browser
      if (uploadDropElement) {
        uploadManager.assignUploadDrop(uploadDropElement);
      } else {
        console.debug(
          'util:filesystem-browser-model#onInsertElement: uploadDropElement not found, upload using files drag&drop will not work'
        );
      }
      if (uploadBrowseElement) {
        uploadManager.assignUploadBrowse(uploadBrowseElement);
      } else {
        console.debug(
          'util:filesystem-browser-model#onInsertElement: uploadBrowseElement not found, upload using button will not work'
        );
      }
    }

    uploadManager.changeTargetDirectory(dir);
  },

  /**
   * @override
   */
  onOpenFile(file, options) {
    if (options && options.tapped) {
      this.get('openConfirmDownload')(file);
    } else {
      this.downloadFiles([file]);
    }
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

  downloadFiles(files) {
    const fileIds = files.mapBy('entityId');
    return this.downloadFilesById(fileIds);
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
      selectedItems,
      selectedItemsContainsOnlySymlinks,
    } = this.getProperties('dir', 'selectedItems', 'selectedItemsContainsOnlySymlinks');
    if (!dir) {
      return;
    }
    let tip;
    if (!tip && protectionType) {
      const protectionProperty = `${protectionType}IsProtected`;
      const isProtected = checkProtectionForCurrentDir && get(dir, protectionProperty) ||
        checkProtectionForSelected && selectedItems.isAny(protectionProperty);
      tip = isProtected ? this.t('disabledActionReason.writeProtected', {
        protectionType: this.t(`disabledActionReason.protectionType.${protectionType}`),
      }) : undefined;
    }
    if (!tip && blockFileTypes.length) {
      if (selectedItems.any(file => blockFileTypes.includes(get(file, 'type')))) {
        tip = this.t('disabledActionReason.blockedFileType', {
          fileType: blockFileTypes.map(fileType =>
            this.t(`disabledActionReason.fileTypesPlural.${fileType}`)
          ).join(` ${this.t('disabledActionReason.and')} `),
        });
      }
    }
    if (!tip && blockWhenSymlinksOnly && selectedItemsContainsOnlySymlinks) {
      tip = this.t('disabledActionReason.blockedFileType', {
        fileType: this.t('disabledActionReason.fileTypesPlural.symlink'),
      });
    }
    return tip;
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
    return this.get('btnUpload.action')(...arguments);
  },

  emptyDirNewDirectory() {
    return this.get('btnNewDirectory.action')(...arguments);
  },

  emptyDirPlaceSymlink() {
    return this.get('btnPlaceSymlink.action')(...arguments);
  },

  emptyDirPlaceHardlink() {
    return this.get('btnPlaceHardlink.action')(...arguments);
  },

  emptyDirPaste() {
    return this.get('btnPaste.action')(...arguments);
  },

  changeTagHover(tag, isHovered) {
    this.set(`${tag}HeaderTagIsHovered`, isHovered);
  },
});
