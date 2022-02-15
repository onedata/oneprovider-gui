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

export default FilesystemBrowserModel.extend({
  // FIXME: remove when modal will be made
  filesViewResolver: service(),
  parentAppNavigation: service(),

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
   * Used only when `renderArchiveDipSwitch` is true.
   * Should be set to true if opened archive has `relatedDip/Aip`
   * @type {ComputedProperty<Boolean>}
   */
  isArchiveDipAvailable: bool('archive.config.includeDip'),

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

  async symlinkedDirExternalContext(dirSymlink) {
    const currentDir = this.get('dir');
    const filesViewContextFactory =
      FilesViewContextFactory.create({ ownerSource: this });
    const targetDir = get(dirSymlink, 'effFile');
    const targetFileContext = await filesViewContextFactory.createFromFile(targetDir);
    const currentFileContext = await filesViewContextFactory.createFromFile(currentDir);
    return currentFileContext.isEqual(targetFileContext) ? null : targetFileContext;
  },

  /**
   * @param {Model.File} dirSymlink
   * @returns {boolean} true if `dirSymlink` is link to external archive and dir open
   *   should be handled by question to user, not by standard dir change
   */
  async handlePotentialExternalSymlink(dirSymlink) {
    const externalContext = await this.symlinkedDirExternalContext(dirSymlink);
    if (externalContext) {
      this.openExternalSymlinkModal(
        dirSymlink,
        externalContext
      );
      return true;
    } else {
      return false;
    }
  },

  async openExternalSymlinkModal(dirSymlink, externalContext) {
    // FIXME: dummy implementation
    const shouldRedirect = window.confirm('redirect?');
    if (shouldRedirect) {
      const url = this.get('filesViewResolver').generateUrl(externalContext, 'open');
      this.get('parentAppNavigation').openUrl(url);
    }
  },
});
