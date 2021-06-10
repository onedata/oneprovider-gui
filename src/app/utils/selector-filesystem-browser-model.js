/**
 * Implementation of browser-model (logic and co-related data) of filesystem-browser
 * for selecting files.
 *
 * @module utils/selector-filesystem-browser-model
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import FilesystemBrowserModel from 'oneprovider-gui/utils/filesystem-browser-model';

export default FilesystemBrowserModel.extend({
  /**
   * @virtual
   * @type {(Object) => any}
   */
  onSubmitSingleItem: notImplementedIgnore,

  /**
   * @override
   */
  buttonNames: Object.freeze([
    'btnRefresh',
  ]),

  /**
   * @override
   */
  disableStatusBar: true,

  /**
   * @override
   */
  onOpenFile(item /*, options */ ) {
    this.get('onSubmitSingleItem')(item);
  },
});
