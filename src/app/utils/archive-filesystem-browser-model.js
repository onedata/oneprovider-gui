/**
 * Implementation of browser-model (logic and co-related data) of filesystem-browser
 * for browsing archive files.
 *
 * @module utils/archive-filesystem-browser-model
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FilesystemBrowserModel from 'oneprovider-gui/utils/filesystem-browser-model';
import { bool } from 'ember-awesome-macros';
import { defaultFilesystemFeatures } from 'oneprovider-gui/components/filesystem-browser/file-features';
import _ from 'lodash';
import { FilesViewContextFactory } from 'oneprovider-gui/utils/files-view-context';
import { get } from '@ember/object';
import { inject as service } from '@ember/service';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default FilesystemBrowserModel.extend({
  modalManager: service(),

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
  buttonNames: Object.freeze([
    'btnRefresh',
    'btnInfo',
    'btnDownload',
    'btnDownloadTar',
    'btnShare',
    'btnMetadata',
    'btnPermissions',
    'btnDistribution',
    'btnQos',
  ]),

  /**
   * @override
   */
  readonlyFilesystem: true,

  /**
   * @override
   */
  browserClass: 'filesystem-browser archive-filesystem-browser',

  /**
   * @override
   */
  headRowComponentName: 'archive-filesystem-browser/table-head-row',

  /**
   * @override
   */
  emptyDirComponentName: 'archive-filesystem-browser/empty-dir',

  /**
   * @override
   */
  fileFeatures: _.without(defaultFilesystemFeatures, 'effDatasetMembership'),

  /**
   * @type {Utils.ModalManager.ModalInstance}
   */
  externalSymlinkModal: null,

  /**
   * Used only when `renderArchiveDipSwitch` is true.
   * Should be set to true if opened archive has `relatedDip/Aip`
   * @type {ComputedProperty<Boolean>}
   */
  isArchiveDipAvailable: bool('archive.config.includeDip'),

  /**
   * @override
   */
  destroy() {
    try {
      this.closeExternalSymlinkModal();
    } finally {
      this._super(...arguments);
    }
  },

  /**
   * @override
   */
  async onChangeDir(targetDir, updateBrowserDir) {
    let shouldChangeDir = true;
    if (get(targetDir, 'type') === 'symlink') {
      shouldChangeDir = !(await this.handlePotentialExternalSymlink(targetDir));
    }
    if (shouldChangeDir) {
      await updateBrowserDir(targetDir);
    }
  },

  /**
   * @override
   */
  async onOpenFile(file, /* options */ ) {
    const _super = this._super;
    let hasBeenHandled = false;
    try {
      hasBeenHandled = await this.handlePotentialExternalSymlink(file);
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
    const externalContext = await this.symlinkExternalContext(symlink);
    if (externalContext) {
      this.openExternalSymlinkModal(
        symlink,
        externalContext,
      );
      return true;
    } else {
      return false;
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
});
