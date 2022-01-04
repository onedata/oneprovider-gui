/**
 * Implementation of browser-model (logic and co-related data) of filesystem-browser
 * for selecting location (navigate to single directory where something should be done).
 *
 * @module utils/select-location-filesystem-browser-model
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FilesystemBrowserModel from 'oneprovider-gui/utils/filesystem-browser-model';
import { get } from '@ember/object';
import { raw } from 'ember-awesome-macros';

export default FilesystemBrowserModel.extend({
  /**
   * @override
   */
  buttonNames: raw([
    'btnUpload',
    'btnNewDirectory',
    'btnRefresh',
    'btnRename',
  ]),

  /**
   * @override
   */
  disableStatusBar: true,

  /**
   * @override
   */
  singleSelect: true,

  /**
   * @override
   * @param {Models.File} item
   */
  isItemDisabled(item) {
    return get(item, 'effFile.type') !== 'dir';
  },

  /**
   * @override
   */
  onOpenFile( /* item, options */ ) {
    // completely ignore opening files
  },
});
