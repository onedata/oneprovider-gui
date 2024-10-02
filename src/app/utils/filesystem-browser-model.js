/**
 * Implementation of browser-model (logic and co-related data) for filesystem-browser
 * (a browser for mananging files and directories).
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { inject as service } from '@ember/service';
import handleMultiFilesOperation from 'oneprovider-gui/utils/handle-multi-files-operation';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import createThrottledFunction from 'onedata-gui-common/utils/create-throttled-function';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import EmberObject, { computed, get } from '@ember/object';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import BaseBrowserModel from 'oneprovider-gui/utils/base-browser-model';
import {
  actionContext,
  anySelectedContexts,
} from 'oneprovider-gui/components/file-browser';
import DownloadInBrowser from 'oneprovider-gui/mixins/download-in-browser';
import recordIcon from 'onedata-gui-common/utils/record-icon';
import { array, raw, and, not } from 'ember-awesome-macros';
import { defaultFilesystemFeatures } from 'oneprovider-gui/components/filesystem-browser/file-features';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { allSettled } from 'rsvp';
import FilesystemBrowserListPoller from 'oneprovider-gui/utils/filesystem-browser-list-poller';
import waitForRender from 'onedata-gui-common/utils/wait-for-render';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';
import FileConsumerMixin from 'oneprovider-gui/mixins/file-consumer';
import ColumnsConfiguration from 'oneprovider-gui/utils/columns-configuration';
import isFileRecord from 'oneprovider-gui/utils/is-file-record';
import _ from 'lodash';
import { asyncObserver } from 'onedata-gui-common/utils/observer';

/**
 * Filesystem browser model supports a set of injectable string commands that allows
 * to invoke actions in the browser in a simple way. Available commands:
 * - download - download currently selected file(s)
 * @typedef {'download'} FilesystemBrowserModel.Command
 */

export const commonActionIcons = Object.freeze({
  info: 'browser-info',
  hardlinks: 'text-link',
  metadata: 'browser-metadata',
  permissions: 'browser-permissions',
  shares: 'browser-share',
  qos: 'qos',
  distribution: 'provider',
});

const availableButtonNames = Object.freeze([
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

const columnsRequirementsDependencies = [
  'size',
  'modification',
  'owner',
  'replication',
  'qos',
  'atime',
  'ctime',
  'creationTime',
  'fileId',
  'posixPermissions',
].map(columnName =>
  `${columnName}.isEnabled,${columnName}.isVisible`
).join(',');

const mixins = [
  FileConsumerMixin,
  DownloadInBrowser,
];

export default BaseBrowserModel.extend(...mixins, {
  errorExtractor: service(),
  fileManager: service(),
  globalNotify: service(),
  isMobile: service(),
  uploadManager: service(),
  workflowManager: service(),
  modalManager: service(),
  media: service(),
  appProxy: service(),
  parentAppNavigation: service(),

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
   * @param {Models.File|Array<Models.File>} files file(s) to show info for it/them
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
   * Close all opened modals that overlays browser view.
   * Should be used only for main file browser (not opened in modal).
   * @virtual optional
   * @type {Function}
   */
  closeAllModals: notImplementedIgnore,

  /**
   * File features displayed in status bar - see `component:file-browser/file-features`
   * `features` property.
   * @virtual optional
   * @type {Array<ItemFeatureSpec>}
   */
  fileFeatures: defaultFilesystemFeatures,

  /**
   * If provided, the additional component will be injected inside file-features.
   * Interface of extension component:
   * - `browserModel: Utils.FilesystemBrowserModel` (or child classes)
   * - `item: Models.File`
   * - `displayedState: Object` (see `components/file-browser/item-features-container`)
   * @virtual optional
   * @type {String}
   */
  fileFeaturesExtensionComponentName: null,

  /**
   * If true, do not show actions and options for directory statistics.
   * @virtual optional
   * @type {boolean}
   */
  isDirStatsFeatureHidden: false,

  /**
   * If true, never show size for directory, even if it is provided by backend.
   * @virtual optional
   * @type {boolean}
   */
  isDirSizeAlwaysHidden: false,

  /**
   * If provided - names of the columns in this array will be disabled (always hidden).
   * @vitual optional
   * @type {Array<ColumnName>}
   */
  disabledColumns: undefined,

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
  mobileSecondaryInfoComponentName: 'filesystem-browser/table-row-mobile-secondary-info',

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
  headFirstCellComponentName: 'filesystem-browser/table-head-first-cell',

  /**
   * @override
   */
  headRowTranslation: 'components.filesystemBrowser.tableHeadRow',

  /**
   * @override
   */
  headRowClass: 'filesystem-table-head-row',

  /**
   * @override
   */
  firstColumnClass: 'fb-table-col-files',

  /**
   * @override
   */
  emptyDirComponentName: 'filesystem-browser/empty-dir',

  /**
   * @override
   */
  dirLoadErrorComponentName: 'filesystem-browser/dir-load-error',

  /**
   * @override
   */
  isUsingUploadArea: true,

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
  buttonNames: computed('dirViewLoadError', function buttonNames() {
    return this.dirViewLoadError ? ['btnRefresh'] : availableButtonNames;
  }),

  /**
   * @override
   */
  infoIconActionName: 'info',

  /**
   * @override
   */
  browserPersistedConfigurationKey: 'filesystem',

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  fileRequirements: computed(
    'dir',
    'parentDirRequirement',
    'listingRequirement',
    function fileRequirements() {
      if (!this.dir) {
        return [];
      }
      return [this.parentDirRequirement, this.listingRequirement].filter(Boolean);
    },
  ),

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  usedFileGris: computed(
    'dir',
    'itemsArray.sourceArray.[]',
    function usedFileGris() {
      const resultUsedFiles = [];
      // Checking if dir and items are files, because dir and itemsArray are read from
      // fb-table, which could have items not yet updated.
      if (this.dir && isFileRecord(this.dir)) {
        resultUsedFiles.push(this.dir);
      }
      // Do not create itemsArray if it was not initialized yet, because
      // it will trigger reload on init, which will fetch files without
      // `fileRequirements` defined.
      const itemsArray = this.cacheFor('itemsArray');
      if (itemsArray) {
        const listedFiles = itemsArray.sourceArray.filter(item =>
          isFileRecord(item)
        );
        resultUsedFiles.push(...listedFiles);
      }
      return resultUsedFiles.map(file => get(file, 'id'));
    },
  ),

  /**
   * @type {boolean}
   */
  hasXattrColumnsSupport: true,

  parentDirRequirement: computed(
    'dir',
    'browserFilesProperties',
    function parentDirRequirement() {
      if (!this.dir) {
        return;
      }
      const parentDirGri = get(this.dir, 'id');
      return new FileRequirement({
        properties: this.browserFilesProperties,
        fileGri: parentDirGri,
      });
    }
  ),

  listingRequirement: computed(
    'dir',
    'listedFilesProperties',
    function listingRequirement() {
      if (!this.dir) {
        return;
      }
      const parentDirId = this.get('dir.effFile.entityId') || this.get('dir.entityId');
      return new FileRequirement({
        properties: this.listedFilesProperties,
        parentId: parentDirId,
      });
    }
  ),

  browserFilesProperties: computed(
    'previewMode',
    'fileFeatures',
    function browserFilesProperties() {
      const basicPropertySet = new Set([
        'index',
      ]);
      if (!this.previewMode) {
        // needed by some buttons to be configured
        // dataIsProtected is also needed by FilesystemBrowser::EmptyDir component
        basicPropertySet
          .add('dataIsProtectedByDataset')
          .add('dataIsProtected')
          .add('isRecalling');
      }

      // Properties that are needed by nested components - added here for requirements
      // to be available before rows are rendered (which could cause records reload,
      // it requirements wouldn't be prepared earlier).
      if (!this.previewMode) {
        // file-features component
        if (this.fileFeatures.includes('effDatasetInheritancePath')) {
          basicPropertySet
            .add('effDatasetInheritancePath')
            .add('dataIsProtected')
            .add('metadataIsProtected');
        }
        if (this.fileFeatures.includes('effQosInheritancePath')) {
          basicPropertySet.add('effQosInheritancePath');
        }
        if (this.fileFeatures.includes('recallingInheritancePath')) {
          basicPropertySet
            .add('recallingInheritancePath')
            .add('archiveRecallRootFileId');
        }

        // table-row-status-bar component
        basicPropertySet.add('isShared');
      }

      return [...basicPropertySet.values()];
    }
  ),

  // TODO: VFS-11460 Optimize number of invoked usedFileGris and fileRequirements

  listedFilesProperties: computed(
    'media.isMobile',
    'browserFilesProperties',
    `columnsConfiguration.columns.{${columnsRequirementsDependencies}}`,
    'columnsConfiguration.listedFilesProperties',
    function listedFilesProperties() {
      const listedFilesPropertySet = new Set([
        ...this.browserFilesProperties,
        // table-row-status-bar component
        'activePermissionsType',
        'posixPermissions',
        'hasCustomMetadata',
      ]);
      if (!this.previewMode) {
        listedFilesPropertySet
          .add('hardlinkCount')
          .add('shareRecords')
          .add('isShared');
      }
      if (this.media.isMobile) {
        // File details always shown in mobile mode,
        // see FilesystemBrowser::TableRowMobileSecondaryInfo component.
        listedFilesPropertySet
          // TODO: VFS-11449 optional file size fetch
          .add('mtime');
      } else {
        const filesProperties = this.columnsConfiguration.listedFilesProperties;
        for (const property of filesProperties) {
          listedFilesPropertySet.add(property);
        }
      }
      return [...listedFilesPropertySet.values()];
    }
  ),

  /**
   * CSS selector of element(s) which right click on SHOULD NOT cause opening current dir
   * context menu.
   * @type {string}
   */
  ignoreCurrentDirContextMenuSelector: '.jump-bar-form-group',

  /**
   * Used to inform various parts of component that files and directories data
   * and metadata cannot be modified (eg. upload, delete).
   * @type {Boolean}
   */
  readonlyFilesystem: false,

  //#region state

  /**
   * Name of feature tag in header that is currently hovered.
   * @type {Boolean}
   */
  hoveredHeaderTag: null,

  /**
   * Timeout ID for removing transition class for tags.
   * See `animateHighlight` observer.
   * @type {Number|null}
   */
  highlightAnimationTimeoutId: null,

  /**
   * Current value in jump-control input.
   * @type {string}
   */
  jumpControlValue: '',

  //#endregion

  //#region Action buttons

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
      return this.createItemBrowserAction({
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
    'dir.{dataIsProtected,isRecalling}',
    function btnUpload() {
      const uploadManager = this.get('uploadManager');
      const actionId = 'upload';
      const tip = this.generateDisabledTip({
        protectionType: 'data',
        checkProtectionForCurrentDir: true,
        checkProtectionForSelected: false,
        blockCurrentDirRecalling: true,
      });
      const disabled = Boolean(tip);
      return this.createItemBrowserAction({
        id: actionId,
        class: 'browser-upload',
        action: () => uploadManager.triggerUploadDialog(),
        disabled,
        tip,
        showIn: [
          actionContext.inDir,
          actionContext.currentDir,
          actionContext.rootDir,
        ],
      });
    }
  ),

  btnNewDirectory: computed(
    'dir.{dataIsProtected,isRecalling}',
    function btnNewDirectory() {
      const actionId = 'newDirectory';
      const tip = this.generateDisabledTip({
        protectionType: 'data',
        checkProtectionForCurrentDir: true,
        checkProtectionForSelected: false,
        blockCurrentDirRecalling: true,
      });
      const disabled = Boolean(tip);
      return this.createItemBrowserAction({
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
          actionContext.rootDir,
        ],
      });
    }
  ),

  btnShare: computed(
    'selectedItems.0.sharesCount',
    'spacePrivileges.{view,manageShares}',
    'selectedItemsContainsOnlySymlinks',
    function btnShare() {
      const {
        spacePrivileges,
        i18n,
      } = this.getProperties(
        'spacePrivileges',
        'i18n',
      );
      let disabledTip = this.generateDisabledTip({
        blockWhenSymlinksOnly: true,
      });
      const file = this.selectedItems[0];
      const canView = get(spacePrivileges, 'view');
      if (!disabledTip && !canView) {
        disabledTip = insufficientPrivilegesMessage({
          i18n,
          modelName: 'space',
          privilegeFlag: 'space_view',
        });
      }
      // if there are no created shares and user has no privileges, lock context item
      // if there are already created shares - allow to open to browse shares
      const cannotOpenForCreate = !get(spacePrivileges, 'manageShares') &&
        !(file && get(file, 'sharesCount'));
      if (!disabledTip && cannotOpenForCreate) {
        disabledTip = insufficientPrivilegesMessage({
          i18n,
          modelName: 'space',
          privilegeFlag: 'space_manage_shares',
        });
      }
      return this.createItemBrowserAction({
        id: 'share',
        icon: commonActionIcons.shares,
        action: (files) => {
          return this.openFileShare(files[0]);
        },
        disabled: Boolean(disabledTip),
        tip: disabledTip,
        showIn: [
          actionContext.singleFile,
          actionContext.singleDir,
          actionContext.currentDir,
          actionContext.rootDir,
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
      return this.createItemBrowserAction({
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
          actionContext.rootDir,
        ],
      });
    }
  ),

  btnMetadata: computed('selectedItemsContainsOnlySymlinks', function btnMetadata() {
    const disabledTip = this.generateDisabledTip({
      blockWhenSymlinksOnly: true,
    });
    return this.createItemBrowserAction({
      id: 'metadata',
      icon: commonActionIcons.metadata,
      disabled: Boolean(disabledTip),
      tip: disabledTip,
      action: (files) => {
        return this.get('openInfo')(files, 'metadata');
      },
      showIn: [
        actionContext.singleDir,
        actionContext.singleFile,
        actionContext.currentDir,
        actionContext.rootDir,
      ],
    });
  }),

  btnInfo: computed(function btnInfo() {
    return this.createItemBrowserAction({
      id: 'info',
      icon: commonActionIcons.info,
      action: (files, activeTab) => {
        return this.get('openInfo')(files, activeTab);
      },
      showIn: [
        actionContext.singleDir,
        actionContext.singleFile,
        actionContext.currentDir,
        actionContext.rootDir,
        actionContext.singleDirPreview,
        actionContext.singleFilePreview,
        actionContext.currentDirPreview,
        actionContext.rootDirPreview,
      ],
    });
  }),

  btnRecallInfo: computed(
    'showRecallInfoButton',
    function btnRecallInfo() {
      const hidden = !this.get('showRecallInfoButton');
      return this.createItemBrowserAction({
        id: 'recallInfo',
        icon: 'browser-archive-recall',
        action: (files, activeTab) => {
          return this.get('openRecallInfo')(files[0], activeTab);
        },
        hidden,
        showIn: [
          actionContext.singleDir,
          actionContext.singleFile,
          actionContext.currentDir,
          actionContext.rootDir,
        ],
      });
    }
  ),

  btnDownload: computed(
    'selectedItemsContainsOnlyBrokenSymlinks',
    function btnDownload() {
      return this.createItemBrowserAction({
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
      return this.createItemBrowserAction({
        id: 'downloadTar',
        icon: 'browser-download',
        disabled: this.get('selectedItemsContainsOnlyBrokenSymlinks'),
        action: (files) => {
          return this.downloadFiles(files);
        },
        showIn: [
          actionContext.currentDir,
          actionContext.currentDirPreview,
          actionContext.rootDir,
          actionContext.rootDirPreview,
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

  btnRename: computed(
    'isOnlyRootDirSelected',
    'dir.dataIsProtected',
    'selectedItemsContainsRecalling',
    function btnRename() {
      const actionId = 'rename';
      let tip = this.generateDisabledTip({
        disabledForRootDir: true,
        protectionType: 'data',
        protectionScope: 'final',
        checkProtectionForSelected: false,
        checkProtectionForCurrentDir: true,
        blockSelectedRecalling: true,
      });
      if (!tip) {
        // also check if file is not protected by dataset - just as in delete operation
        tip = this.generateDisabledTip({
          protectionType: 'data',
          protectionScope: 'dataset',
          checkProtectionForSelected: true,
          checkProtectionForCurrentDir: false,
        });
      }
      const disabled = Boolean(tip);
      return this.createItemBrowserAction({
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
          actionContext.rootDir,
        ],
      });
    }
  ),

  btnPermissions: computed(
    'isOnlyRootDirSelected',
    'selectedItemsContainsOnlySymlinks',
    function btnPermissions() {
      const disabledTip = this.generateDisabledTip({
        disabledForRootDir: true,
        blockWhenSymlinksOnly: true,
      });
      return this.createItemBrowserAction({
        id: 'permissions',
        icon: commonActionIcons.permissions,
        disabled: Boolean(disabledTip),
        tip: disabledTip,
        action: (files) => {
          return this.get('openInfo')(files.rejectBy('type', 'symlink'), 'permissions');
        },
        showIn: [
          ...anySelectedContexts,
          actionContext.currentDir,
          actionContext.rootDir,
        ],
      });
    }
  ),

  btnCreateSymlink: computed('selectedItems.length', function btnCreateSymlink() {
    const areManyFilesSelected = this.get('selectedItems.length') > 1;
    return this.createItemBrowserAction({
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
      showIn: [
        ...anySelectedContexts,
        actionContext.currentDir,
        actionContext.rootDir,
      ],
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
      return this.createItemBrowserAction({
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
        showIn: [
          ...anySelectedContexts,
          actionContext.currentDir,
          actionContext.rootDir,
        ],
      });
    }
  ),

  btnPlaceSymlink: computed(function btnPlaceSymlink() {
    return this.createItemBrowserAction({
      id: 'placeSymlink',
      icon: 'shortcut',
      action: () => this.placeSymlinks(),
      showIn: [
        actionContext.inDir,
        actionContext.currentDir,
        actionContext.rootDir,
      ],
    });
  }),

  btnPlaceHardlink: computed(
    'fileClipboardFiles.[]',
    function btnPlaceHardlink() {
      return this.createItemBrowserAction({
        id: 'placeHardlink',
        icon: commonActionIcons.hardlinks,
        action: () => this.placeHardlinks(),
        showIn: [
          actionContext.inDir,
          actionContext.currentDir,
          actionContext.rootDir,
        ],
      });
    }
  ),

  btnCopy: computed('selectedItemsContainsOnlySymlinks', function btnCopy() {
    const disabledTip = this.generateDisabledTip({
      blockWhenSymlinksOnly: true,
    });
    return this.createItemBrowserAction({
      id: 'copy',
      disabled: Boolean(disabledTip),
      tip: disabledTip,
      action: (files) => {
        const browserInstance = this.get('browserInstance');
        browserInstance.setFileClipboardFiles(files.rejectBy('type', 'symlink'));
        browserInstance.setFileClipboardMode('copy');
      },
      showIn: [
        ...anySelectedContexts,
        actionContext.currentDir,
        actionContext.rootDir,
      ],
    });
  }),

  btnCut: computed(
    'isOnlyRootDirSelected',
    'selectedItemsContainsOnlySymlinks',
    'dir.dataIsProtected',
    'selectedItemsContainsRecalling',
    function btnCut() {
      const actionId = 'cut';
      let tip = this.generateDisabledTip({
        disabledForRootDir: true,
        protectionType: 'data',
        protectionScope: 'final',
        checkProtectionForSelected: false,
        checkProtectionForCurrentDir: true,
        blockWhenSymlinksOnly: true,
        blockSelectedRecalling: true,
      });
      if (!tip) {
        // also check if file is not protected by dataset - just as in delete operation
        tip = this.generateDisabledTip({
          protectionType: 'data',
          protectionScope: 'dataset',
          checkProtectionForSelected: true,
          checkProtectionForCurrentDir: false,
        });
      }
      const disabled = Boolean(tip);
      return this.createItemBrowserAction({
        id: actionId,
        action: (files) => {
          const browserInstance = this.get('browserInstance');
          browserInstance.setFileClipboardFiles(files.rejectBy('type', 'symlink'));
          browserInstance.setFileClipboardMode('move');
        },
        disabled,
        tip,
        showIn: [
          ...anySelectedContexts,
          actionContext.currentDir,
          actionContext.rootDir,
        ],
      });
    }
  ),

  btnPaste: computed(
    'dir.dataIsProtected',
    'selectedItemsContainsRecalling',
    function btnPaste() {
      const actionId = 'paste';
      const tip = this.generateDisabledTip({
        protectionType: 'data',
        checkProtectionForCurrentDir: true,
        checkProtectionForSelected: false,
        blockSelectedRecalling: true,
      });
      const disabled = Boolean(tip);
      return this.createItemBrowserAction({
        id: actionId,
        action: () => this.pasteFiles(),
        disabled,
        tip,
        showIn: [
          actionContext.inDir,
          actionContext.currentDir,
          actionContext.rootDir,
        ],
      });
    }
  ),

  btnDelete: computed(
    'isOnlyRootDirSelected',
    'selectedItems.@each.dataIsProtectedByDataset',
    'selectedItemsContainsRecalling',
    function btnDelete() {
      const actionId = 'delete';
      const tip = this.generateDisabledTip({
        disabledForRootDir: true,
        protectionType: 'data',
        protectionScope: 'dataset',
        blockSelectedRecalling: true,
      });
      const disabled = Boolean(tip);
      return this.createItemBrowserAction({
        id: actionId,
        action: async (files) => {
          const currentDir = this.dir;
          const isRemovingCurrentDir = files.length === 1 && files[0] === currentDir;
          let currentDirParent;
          let onRemoved;
          if (isRemovingCurrentDir) {
            currentDirParent = await this.resolveFileParentFun(currentDir);
            onRemoved = async (removedFiles) => {
              // check if the dir is still opened as current dir
              if (
                removedFiles[0] === currentDir &&
                currentDir &&
                this.dir === currentDir &&
                currentDirParent
              ) {
                this.changeDir(currentDirParent);
              }
            };
          }
          return this.openRemove(
            files,
            isRemovingCurrentDir ? currentDirParent : this.dir,
            onRemoved
          );
        },
        disabled,
        tip,
        showIn: [
          ...anySelectedContexts,
          actionContext.currentDir,
          actionContext.rootDir,
        ],
      });
    }
  ),

  btnDistribution: computed(
    'selectedItemsContainsOnlySymlinks',
    function btnDistribution() {
      const disabledTip = this.generateDisabledTip({
        blockWhenSymlinksOnly: true,
      });
      return this.createItemBrowserAction({
        id: 'distribution',
        icon: commonActionIcons.distribution,
        disabled: Boolean(disabledTip),
        tip: disabledTip,
        showIn: [
          ...anySelectedContexts,
          actionContext.currentDir,
          actionContext.rootDir,
        ],
        action: (files) => {
          return this.get('openInfo')(files.rejectBy('type', 'symlink'), 'distribution');
        },
      });
    }
  ),

  btnQos: computed(
    'spacePrivileges.{viewQos,manageQos}',
    'openInfo',
    'selectedItemsContainsOnlySymlinks',
    function btnQos() {
      const {
        spacePrivileges,
        openInfo,
        i18n,
      } = this.getProperties(
        'spacePrivileges',
        'openInfo',
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
      return this.createItemBrowserAction({
        id: 'qos',
        icon: commonActionIcons.qos,
        showIn: [
          ...anySelectedContexts,
          actionContext.currentDir,
          actionContext.rootDir,
        ],
        disabled: Boolean(disabledTip),
        tip: disabledTip,
        action: (files) => {
          const supportedFiles = files.rejectBy('type', 'symlink');
          return openInfo(supportedFiles, 'qos');
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
      return this.createItemBrowserAction({
        id: 'runWorkflow',
        icon: recordIcon('atmWorkflowSchema'),
        showIn: [
          ...anySelectedContexts,
          actionContext.currentDir,
          actionContext.rootDir,
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

  isOwnerVisible: not('previewMode'),

  /**
   * @type {ComputedProperty<Array<String>>}
   */
  customClassNames: computed(
    'hoveredHeaderTag',
    'highlightAnimationTimeoutId',
    function customClassNames() {
      const {
        hoveredHeaderTag,
        highlightAnimationTimeoutId,
      } = this.getProperties(
        'hoveredHeaderTag',
        'highlightAnimationTimeoutId'
      );
      const classes = [];
      if (hoveredHeaderTag) {
        classes.push(
          `highlight-inherited-${hoveredHeaderTag}`,
          'highlight-inherited',
        );
      }
      if (hoveredHeaderTag || highlightAnimationTimeoutId) {
        classes.push('highlight-transition');
      }
      return classes;
    }
  ),

  /**
   * @type {ComputedProperty<boolean>}
   */
  selectedItemsContainsRecalling: computed(
    'selectedItems.@each.isRecalling',
    function selectedItemsContainsRecalling() {
      return this.selectedItems?.some(item => item && get(item, 'isRecalling'));
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
        get(selectedItems[0], 'recallingInheritancePath') === 'ancestor' ||
        get(selectedItems[0], 'recallingInheritancePath') === 'direct'
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

  onTagHoverChange: computed(function onTagHoverChange() {
    return this.changeTagHover.bind(this);
  }),

  animateHighlight: asyncObserver(
    'hoveredHeaderTag',
    function animateHighlight() {
      if (this.highlightAnimationTimeoutId) {
        this.set('highlightAnimationTimeoutId', null);
        clearTimeout(this.highlightAnimationTimeoutId);
      }
      if (!this.hoveredHeaderTag) {
        this.set(
          'highlightAnimationTimeoutId',
          // timeout time is slightly longer than defined transition time in
          // file-status-bar.scss
          setTimeout(() => {
            this.set('highlightAnimationTimeoutId', null);
          }, 101)
        );
      }
    }
  ),

  /**
   * @override
   */
  createColumnsConfiguration() {
    const columnsOrder = _.without(
      [
        'size',
        'modification',
        'owner',
        'replication',
        'qos',
        'atime',
        'ctime',
        'creationTime',
        'posixPermissions',
        'fileId',
      ],
      ...(this.disabledColumns ?? [])
    );
    const columns = {};
    const columnsTimesWidth = 130;
    for (const columnName of columnsOrder) {
      switch (columnName) {
        case 'size':
          columns.size = EmberObject.create({
            isVisible: true,
            isEnabled: true,
            width: 140,
            hasSubname: false,
            hasTooltip: false,
            type: 'basic',
            fileProperty: 'size',
          });
          break;
        case 'modification':
          columns.modification = EmberObject.create({
            isVisible: true,
            isEnabled: true,
            width: columnsTimesWidth,
            hasSubname: true,
            hasTooltip: true,
            type: 'basic',
            fileProperty: 'mtime',
          });
          break;
        case 'owner':
          columns.owner = EmberObject.create({
            isVisible: true,
            isEnabled: true,
            width: 200,
            hasSubname: false,
            hasTooltip: false,
            type: 'basic',
            fileProperty: 'owner',
          });
          break;
        case 'replication':
          columns.replication = EmberObject.create({
            isVisible: false,
            isEnabled: false,
            width: 160,
            hasSubname: false,
            hasTooltip: true,
            type: 'basic',
            fileProperty: 'localReplicationRate',
          });
          break;
        case 'qos':
          columns.qos = EmberObject.create({
            isVisible: false,
            isEnabled: false,
            width: 100,
            hasSubname: false,
            hasTooltip: true,
            type: 'basic',
            fileProperty: 'aggregateQosStatus',
          });
          break;
        case 'atime':
          columns.atime = EmberObject.create({
            isVisible: false,
            isEnabled: false,
            width: columnsTimesWidth,
            hasSubname: false,
            hasTooltip: true,
            type: 'basic',
            fileProperty: 'atime',
          });
          break;
        case 'ctime':
          columns.ctime = EmberObject.create({
            isVisible: false,
            isEnabled: false,
            width: columnsTimesWidth,
            hasSubname: true,
            hasTooltip: true,
            type: 'basic',
            fileProperty: 'ctime',
          });
          break;
        case 'creationTime':
          columns.creationTime = EmberObject.create({
            isVisible: false,
            isEnabled: false,
            width: columnsTimesWidth,
            hasSubname: false,
            hasTooltip: true,
            type: 'basic',
            fileProperty: 'creationTime',
          });
          break;
        case 'fileId':
          columns.fileId = EmberObject.create({
            isVisible: false,
            isEnabled: false,
            width: 120,
            hasSubname: false,
            hasTooltip: false,
            type: 'basic',
            fileProperty: 'fileId',
          });
          break;
        case 'posixPermissions':
          columns.posixPermissions = EmberObject.create({
            isVisible: false,
            isEnabled: false,
            width: 150,
            hasSubname: false,
            hasTooltip: true,
            type: 'basic',
            fileProperty: 'posixPermissions',
          });
          break;
        default:
          break;
      }
    }
    return ColumnsConfiguration.create({
      configurationType: this.browserPersistedConfigurationKey,
      hasXattrSettings: this.hasXattrColumnsSupport,
      columns,
      columnsOrder,
      firstColumnWidth: 380,
    });
  },

  /**
   * @param {FilesystemBrowserModel.Command} command
   * @returns {Promise}
   */
  async invokeCommand(command) {
    switch (command) {
      case 'download': {
        await this.handleDownloadCommand();
        break;
      }
      default:
        if (command) {
          console.warn(
            `An unknown command has been invoked in filesystem-browser-model: "${command}", ignoring.`
          );
        }
        break;
    }
  },

  async handleDownloadCommand() {
    await this.initialLoad;
    await waitForRender();
    if (!this.selectedItems?.length) {
      return;
    }
    if (this.selectedItems.length === 1) {
      this.openConfirmDownload(this.selectedItems[0]);
    } else {
      this.downloadFiles(this.selectedItems);
    }
  },

  // TODO: VFS-10743 Currently not used, but this method may be helpful in not-known
  // items select implementation
  /**
   * @override
   */
  async checkItemExistsInParent(parentDirId, file) {
    try {
      await file.reload();
    } catch {
      return false;
    }
    return file.relationEntityId('parent') === parentDirId;
  },

  /**
   * @override
   */
  createBrowserListPoller() {
    return FilesystemBrowserListPoller.create({
      browserModel: this,
    });
  },

  /**
   * @override
   */
  async onDidChangeDir(targetDir) {
    this.changeJumpControlValue('');
    // TODO: VFS-7961 after modification of uploadManager global state, there should be revert
    // if using selector inside filesystem browser
    this.registerUploadDirectory(targetDir);
  },

  /**
   * @override
   */
  onInsertElement() {
    const {
      readonlyFilesystem,
      uploadManager,
      uploadDropElement,
      dir,
    } = this.getProperties(
      'readonlyFilesystem',
      'uploadManager',
      'uploadDropElement',
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
    }
    this.registerUploadDirectory(dir);
  },

  /**
   * @override
   */
  onInsertHeaderElements() {
    if (this.readonlyFilesystem) {
      return;
    }
    const uploadBrowseElement = this.getUploadBrowseElement();
    if (uploadBrowseElement) {
      this.uploadManager.assignUploadBrowse(uploadBrowseElement);
    } else {
      console.debug(
        'onInsertHeaderElements: uploadBrowseElement not found, upload using button will not work'
      );
    }
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
  async onListRefresh() {
    const filesRefreshPromises = this.itemsArray.map(async file => {
      if (get(file, 'isShared')) {
        const shares = await get(file, 'shareRecords');
        await allSettled(shares.invoke('reload'));
      }
    });
    return allSettled(filesRefreshPromises);
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

  /**
   * @override
   */
  fetchDirChildren(dirId, ...fetchArgs) {
    // TODO: VFS-11460 It might be invoked too often - make benchmarks / fix
    // force fileRequirements change
    this.fileConsumerModel?.fileRequirementsObserver();
    return this.fileManager
      .fetchDirChildren(dirId, this.previewMode ? 'public' : 'private', ...fetchArgs);
  },

  registerUploadDirectory(targetDir) {
    this.uploadManager.changeTargetDirectory(this.previewMode ? null : targetDir);
  },

  /**
   * In some specific file browsers, there is a need to show additional inheritable file
   * tags (called "features") that need additional data beside standard file data.
   * This method can be overridden to add additional computed properties to file (by
   * wrapping it) so item-features-container can read status of these features.
   * @param {Models.File} item
   * @returns {Object} a wrapped item with additional feature-properties used by
   *   specific implementation of item-features-container
   */
  featurizeItem(item) {
    return item;
  },

  getUploadBrowseElement() {
    return this.element?.querySelector('.fb-upload-trigger');
  },

  /**
   * @param {Array<Models.File>} files
   * @returns {Promise}
   */
  downloadFiles(files) {
    const fileIds = files.mapBy('entityId');
    return this.downloadFilesById(fileIds);
  },

  /**
   *
   * @param {Object} options
   * @param {boolean} [disabledForRootDir]
   * @param {'data'|'metadata'} [protectionType]
   * @param {'final'|'dataset'} [protectionScope] `final` - check final effective
   *   protection of file (concerns datasets and hardlinks inherited protection);
   *   `dataset` - check only protection inherited from dataset hierarchy.
   * @param {boolean} checkProtectionForCurrentDir
   * @param {boolean} checkProtectionForSelected
   * @param {Array<LegacyFileType>} blockFileTypes
   * @param {boolean} blockWhenSymlinksOnly
   * @param {boolean} blockSelectedRecalling
   * @param {boolean} blockCurrentDirRecalling
   * @returns
   */
  generateDisabledTip({
    disabledForRootDir,
    protectionType,
    protectionScope = 'final',
    checkProtectionForCurrentDir = false,
    checkProtectionForSelected = true,
    blockFileTypes = [],
    blockWhenSymlinksOnly = false,
    blockSelectedRecalling = false,
    blockCurrentDirRecalling = false,
  }) {
    const {
      dir,
      selectedItems,
      selectedItemsContainsOnlySymlinks,
      selectedItemsContainsRecalling,
    } = this.getProperties(
      'dir',
      'selectedItems',
      'selectedItemsContainsOnlySymlinks',
      'selectedItemsContainsRecalling'
    );
    if (!dir) {
      return;
    }
    let tip;
    if (disabledForRootDir && this.isOnlyRootDirSelected) {
      return this.t('disabledActionReason.notAvailableForRootDir');
    }
    if (!tip && protectionType) {
      let protectionProperty = `${protectionType}IsProtected`;
      if (protectionScope === 'dataset') {
        protectionProperty += 'ByDataset';
      }
      const isInProtectedDir =
        checkProtectionForCurrentDir && get(dir, protectionProperty);
      const isProtectedFile =
        checkProtectionForSelected && selectedItems.isAny(protectionProperty);
      const isProtected = isInProtectedDir || isProtectedFile;
      let translationKey = 'disabledActionReason.writeProtected';
      if (
        checkProtectionForCurrentDir &&
        !checkProtectionForSelected &&
        isInProtectedDir
      ) {
        translationKey += 'Dir';
      }
      tip = isProtected ? this.t(translationKey, {
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
    if (!tip && blockCurrentDirRecalling && dir.isRecalling) {
      tip = this.t('disabledActionReason.inRecallingDir');
    }
    if (!tip && blockSelectedRecalling && selectedItemsContainsRecalling) {
      tip = this.t('disabledActionReason.recalling');
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
      () => {
        if (this.isDestroyed) {
          return;
        }
        return fbTableApi.refresh();
      },
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
        await fileManager.createHardlink(get(file, 'originalName'), dir, file, 50);
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
      () => {
        if (this.isDestroyed) {
          return;
        }
        return fbTableApi.refresh();
      },
      1000
    );

    return handleMultiFilesOperation({
      files: fileClipboardFiles,
      globalNotify,
      errorExtractor,
      i18n,
      operationErrorKey: `${i18nPrefix}.linkFailed`,
    }, async (file) => {
      const fileName = get(file, 'originalName');
      const filePath = stringifyFilePath(await resolveFilePath(file), 'originalName');
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
    this.set('hoveredHeaderTag', isHovered ? tag : null);
  },

  changeJumpControlValue(value) {
    this.set('jumpControlValue', value);
  },

  /**
   * @param {Models.File} file
   */
  async openFileShare(file) {
    if (get(file, 'sharesCount')) {
      this.openInfo([file], 'shares');
    } else {
      await this.modalManager.show('share-modal', {
        file,
        onSubmitted: (share, isPublishing) => {
          if (isPublishing) {
            this.openShareOpenData(share);
          } else {
            this.openInfo([file], 'shares');
          }
        },
      }).hiddenPromise;
    }
  },

  disableUploadArea() {
    this.uploadManager.unassignUploadBrowse();
  },

  enableUploadArea() {
    this.uploadManager.assignUploadDrop(this.uploadManager.dropElement);
  },

  /**
   * @param {Models.Share} share
   */
  openShareOpenData(share) {
    const url = this.appProxy.callParent('getShareUrl', {
      shareId: get(share, 'entityId'),
      tabId: 'opendata',
    });
    this.parentAppNavigation.openUrl(url);
  },
});
