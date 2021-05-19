/**
 * Implementation of status part of table row part for archive-browser.
 *
 * @module components/archive-browser/table-row-status-bar
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableRowStatusBar from 'oneprovider-gui/components/file-browser/fb-table-row-status-bar';

// FIXME: maybe all status-bar components should be removed
export default FbTableRowStatusBar.extend({
  classNames: ['archive-table-row-status-bar'],

  /**
   * @override
   */
  i18nPrefix: 'components.datasetBrowser.tableRowStatusBar',
});
