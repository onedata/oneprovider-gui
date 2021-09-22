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

export default FilesystemBrowserModel.extend({
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
   * Used only when `renderArchiveDipSwitch` is true.
   * Should be set to true if opened archive has `relatedDip/Aip`
   * @type {ComputedProperty<Boolean>}
   */
  isArchiveDipAvailable: bool('archive.config.includeDip'),
});
