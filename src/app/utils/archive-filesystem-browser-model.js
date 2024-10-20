/**
 * Implementation of browser-model (logic and co-related data) of filesystem-browser
 * for browsing archive files.
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FilesystemBrowserModel from 'oneprovider-gui/utils/filesystem-browser-model';
import { bool, array, raw, conditional, and } from 'ember-awesome-macros';
import { defaultFilesystemFeatures } from 'oneprovider-gui/components/filesystem-browser/file-features';
import _ from 'lodash';
import { FilesViewContextFactory } from 'oneprovider-gui/utils/files-view-context';
import { get, set, computed } from '@ember/object';
import { or, reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import FileInArchive from 'oneprovider-gui/utils/file-in-archive';
import { allSettled } from 'rsvp';
import ArchiveFilesystemBrowserListPoller from 'oneprovider-gui/utils/archive-filesystem-browser-list-poller';

const allButtonNames = Object.freeze([
  'btnRefresh',
  'btnInfo',
  'btnDownload',
  'btnDownloadTar',
  'btnShare',
  'btnMetadata',
  'btnPermissions',
  'btnDistribution',
  'btnQos',
]);

const archiveRootButtonNames = Object.freeze([
  'btnRefresh',
]);

export default FilesystemBrowserModel.extend({
  modalManager: service(),
  archiveManager: service(),
  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.archiveFilesystemBrowserModel',

  /**
   * @virtual
   * @type {Boolean}
   */
  renderArchiveDipSwitch: false,

  /**
   * One of: aip, dip.
   * Selected corelated archive type to show.
   * Used only when `renderArchiveDipSwitch` is true.
   * @type {String}
   * @virtual
   */
  archiveDipMode: undefined,

  /**
   * Parent archive for browsed filesystem.
   * @virtual
   * @type {Models.Archive}
   */
  archive: undefined,

  /**
   * @virtual optional
   * @type {Function}
   */
  onDirectoryChanged: notImplementedIgnore,

  /**
   * @override
   */
  buttonNames: conditional(
    'isOnlyArchiveRootSelected',
    raw(archiveRootButtonNames),
    raw(allButtonNames),
  ),

  /**
   * @override
   */
  readonlyFilesystem: true,

  /**
   * If archive is not being created, the filesystem of archive should not change.
   * @override
   */
  isListPollingEnabled: or('isFilesystemLive', 'areLiveColumnsVisible'),

  /**
   * @override
   */
  browserClass: array.join(
    array.concat(
      raw(['filesystem-browser', 'archive-filesystem-browser']),
      'customClassNames',
    ),
    raw(' '),
  ),

  /**
   * @override
   */
  headFirstCellComponentName: 'archive-filesystem-browser/table-head-first-cell',

  /**
   * @override
   */
  headRowTranslation: 'components.archiveFilesystemBrowser.tableHeadRow',

  /**
   * @override
   */
  headRowClass: 'archive-filesystem-table-head-row',

  /**
   * @override
   */
  firstColumnClass: 'fb-table-col-files',

  /**
   * @override
   */
  emptyDirComponentName: 'archive-filesystem-browser/empty-dir',

  /**
   * @override
   */
  fileFeaturesExtensionComponentName: 'archive-filesystem-browser/file-features-extension',

  /**
   * @override
   */
  isUsingUploadArea: false,

  /**
   * @override
   */
  headRowComponentName: '',

  /**
   * @override
   */
  fileFeatures: Object.freeze([
    ..._.without(defaultFilesystemFeatures, 'effDatasetInheritancePath'),
    Object.freeze({ key: 'archiveCreating', noticeLevel: 'warning' }),
    Object.freeze({ key: 'archiveCancelled', noticeLevel: 'warning' }),
    Object.freeze({ key: 'archiveFailed', noticeLevel: 'danger' }),
  ]),

  /**
   * @override
   */
  refreshBtnClass: computed(
    'areLiveColumnsVisible',
    'anyDataLoadError',
    'selectedItemsOutOfScope',
    // inherited
    'browserListPoller.isPollingEnabled',
    function refreshBtnClass() {
      if (
        !this.areLiveColumnsVisible &&
        !this.browserListPoller.isPollingEnabled
      ) {
        return 'refresh-indicator-info';
      } else {
        return this._super(...arguments);
      }
    }
  ),

  /**
   * @override
   */
  refreshBtnTip: computed(
    'isFilesystemLive',
    'areLiveColumnsVisible',
    // inherited dependencies
    'selectedItemsOutOfScope',
    'anyDataLoadError',
    'browserListPoller.{pollInterval,isPollingEnabled}',
    'lastRefreshTime',
    function refreshBtnTip() {
      if (this.isFilesystemLive) {
        return this._super(...arguments);
      }
      const pollingIntervalSecs =
        Math.floor(this.browserListPoller?.pollInterval / 1000);
      if (this.areLiveColumnsVisible) {
        if (this.browserListPoller.isPollingEnabled) {
          return this.t('refreshLiveColumns', {
            pollingIntervalSecs: pollingIntervalSecs,
          });
        } else {
          return this._super(...arguments);
        }
      }
      if (this.browserListPoller.isPollingEnabled) {
        return this._super(...arguments);
      } else {
        return this.t('refreshNonLive');
      }
    }
  ),

  isReplicationColumnVisible: reads('columnsConfiguration.columns.replication.isVisible'),

  isQosColumnVisible: reads('columnsConfiguration.columns.qos.isVisible'),

  areLiveColumnsVisible: or('isReplicationColumnVisible', 'isQosColumnVisible'),

  /**
   * @type {Utils.ModalManager.ModalInstance}
   */
  externalSymlinkModal: null,

  isOnlyArchiveRootSelected: and(
    'isOnlyCurrentDirSelected',
    computed('dirId', 'archive', function isCurrentDirArchiveRoot() {
      return this.dirId === this.archive.relationEntityId('rootDir');
    }),
  ),

  /**
   * True if filesystem of archive might change - eg. when archive is being created
   * and files are added and their size grows.
   * @type {ComputedProperty<boolean>}
   */
  isFilesystemLive: array.includes(raw(['creating', 'destroying']), 'archive.metaState'),

  /**
   * Used only when `renderArchiveDipSwitch` is true.
   * Should be set to true if opened archive has `relatedDip/Aip`
   * @type {ComputedProperty<Boolean>}
   */
  isArchiveDipAvailable: bool('archive.config.includeDip'),

  /**
   * @type {string}
   */
  browserPersistedConfigurationKey: 'archiveFilesystem',

  // TODO: VFS-10743 Currently not used, but this method may be helpful in not-known
  // items select implementation
  /**
   * @override
   */
  async checkItemExistsInParent(parentDirId, file) {
    // assuming that files in finished archives could not be deleted or moved
    if (['succeeded', 'cancelled'].includes(get(this.archive, 'metaState'))) {
      return file.relationEntityId('parent') === parentDirId;
    } else {
      return this._super(...arguments);
    }
  },

  /**
   * @override
   */
  createBrowserListPoller() {
    return ArchiveFilesystemBrowserListPoller.create({
      browserModel: this,
    });
  },

  /**
   * @override
   */
  destroy() {
    try {
      this.closeExternalSymlinkModal();
    } catch (error) {
      console.error(
        'util:archive-filesystem-browser-model#destroy: closeExternalSymlinkModal failed',
        error
      );
    }

    this._super(...arguments);
  },

  /**
   * @override
   */
  async onWillChangeDir(targetDir, updateBrowserDir) {
    let shouldChangeDir = true;
    if (get(targetDir, 'type') === 'symlink') {
      shouldChangeDir = !(await this.handlePotentialExternalSymlink(targetDir));
    }
    if (shouldChangeDir) {
      await updateBrowserDir?.(targetDir);
    }
  },

  /**
   * @override
   */
  async onOpenFile(file, /* options */ ) {
    const _super = this._super;
    let hasBeenHandled = false;
    try {
      hasBeenHandled = get(file, 'type') === 'symlink' &&
        await this.handlePotentialExternalSymlink(file);
    } catch (error) {
      console.error(
        'util:archive-filesystem-browser-model#onOpenFile: external symlink check failed',
        error
      );
    }
    if (!hasBeenHandled) {
      return _super.apply(this, arguments);
    }
  },

  /**
   * @override
   */
  featurizeItem(item) {
    const archive = this.get('archive');
    return FileInArchive.create({
      file: item,
      archive,
    });
  },

  createColumnsConfiguration() {
    const configuration = this._super(...arguments);
    // there is AIP/DIP switch instead "jump" input in archive filesystem browser,
    // so we have more space
    set(configuration, 'firstColumnWidth', 220);
    return configuration;
  },

  /**
   * @returns {Promise}
   */
  refreshData() {
    const {
      fileManager,
      archive,
      dir,
    } = this.getProperties('fileManager', 'archive', 'dir');
    const dirId = dir && get(dir, 'entityId');
    return allSettled([
      dirId && fileManager.dirChildrenRefresh(dirId),
      archive && archive.reload(),
    ]);
  },

  async symlinkExternalContext(dirSymlink) {
    const currentDir = this.get('dir');
    const filesViewContextFactory =
      FilesViewContextFactory.create({ ownerSource: this });
    const targetDir = get(dirSymlink, 'effFile');
    const targetFileContext = await filesViewContextFactory.createFromFile(targetDir);
    const currentFileContext = await filesViewContextFactory.createFromFile(currentDir);
    return currentFileContext.isEqual(targetFileContext) ? null : targetFileContext;
  },

  /**
   * @param {Model.File} symlink
   * @returns {boolean} true if `dirSymlink` is link to external archive and dir open
   *   should be handled by question to user, not by standard dir change
   */
  async handlePotentialExternalSymlink(symlink) {
    if (get(symlink, 'type') !== 'symlink') {
      return false;
    }
    try {
      const externalContext = await this.symlinkExternalContext(symlink);
      if (externalContext && !(await this.isNestedArchiveContext(externalContext))) {
        this.openExternalSymlinkModal(
          symlink,
          externalContext,
        );
        return true;
      } else {
        return false;
      }
    } catch (error) {
      this.get('globalNotify').backendError(this.t('checkingSymlinkInArchive'), error);
      return true;
    }
  },

  /**
   * @param {Models.File} symlink
   * @param {Utils.FilesViewContext} externalContext
   * @returns {Utils.ModalManager.ModalInstance}
   */
  openExternalSymlinkModal(symlink, externalContext) {
    const modalManager = this.get('modalManager');
    const externalSymlinkModal = modalManager.show('external-symlink-modal', {
      currentContextType: 'archive',
      symlinkFile: symlink,
      targetFileContext: externalContext,
      onDownloadFile: this.downloadExternalSymlinkedFile.bind(this),
      onDirectoryChanged: this.directoryChanged.bind(this),
      onClose: this.closeExternalSymlinkModal.bind(this),
    });
    return this.set('externalSymlinkModal', externalSymlinkModal);
  },

  directoryChanged() {
    const onDirectoryChanged = this.get('onDirectoryChanged');
    if (onDirectoryChanged) {
      onDirectoryChanged(arguments);
    }
  },

  /**
   * @param {Models.File} file
   * @returns {Promise}
   */
  async downloadExternalSymlinkedFile(file) {
    await this.downloadFiles([file]);
  },

  closeExternalSymlinkModal() {
    const {
      modalManager,
      externalSymlinkModal,
    } = this.getProperties('modalManager', 'externalSymlinkModal');
    if (externalSymlinkModal) {
      modalManager.hide(get(externalSymlinkModal, 'id'));
      this.set('externalSymlinkModal', null);
    }
  },

  async isNestedArchiveContext(filesViewContext) {
    const {
      archiveManager,
      archive,
    } = this.getProperties('archiveManager', 'archive');
    const archiveId = get(filesViewContext, 'archiveId');
    if (!archiveId) {
      return false;
    }
    const archiveToOpen = await archiveManager.getArchive(archiveId);
    const modelArchiveId = get(archive, 'entityId');
    let checkedArchiveParent = archiveToOpen;
    do {
      checkedArchiveParent = await get(checkedArchiveParent, 'parentArchive');
    } while (
      checkedArchiveParent && get(checkedArchiveParent, 'entityId') !== modelArchiveId
    );
    return Boolean(checkedArchiveParent);
  },
});
