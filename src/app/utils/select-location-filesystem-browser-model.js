/**
 * Implementation of browser-model (logic and co-related data) of filesystem-browser
 * for selecting location (navigate to single directory where something should be done).
 *
 * @module utils/select-location-filesystem-browser-model
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FilesystemBrowserModel from 'oneprovider-gui/utils/filesystem-browser-model';
import { get } from '@ember/object';
import { raw } from 'ember-awesome-macros';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default FilesystemBrowserModel.extend({
  /**
   * Called after refresh resolves.
   * @virtual
   * @type {() => void}
   */
  onRefresh: notImplementedIgnore,

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

  /**
   * @override
   */
  async refresh() {
    const result = await this._super(...arguments);
    try {
      this.get('onRefresh')();
    } catch (onRefreshError) {
      console.error(
        'utils:select-location-filesystem-browser-model#refresh: onRefresh call failed',
        onRefreshError
      );
    }
    return result;
  },
});
