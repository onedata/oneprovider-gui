/**
 * Implementation of browser-model (logic and co-related data) of dataset-browser
 * for selecting datasets.
 *
 * @module utils/selector-dataset-browser-model
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import DatasetBrowserModel from 'oneprovider-gui/utils/dataset-browser-model';

export default DatasetBrowserModel.extend({
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
   * Set to true to make status bar tags disabled (non-clickable).
   * @override
   */
  disableStatusBar: true,

  /**
   * Set to true, to turn off archives view links (in dataset rows and
   * no-children-dataset screens).
   * @override
   */
  archivesLinkDisabled: true,

  /**
   * @override
   */
  onOpenFile(item /*, options */ ) {
    this.get('onSubmitSingleItem')(item);
  },
});
