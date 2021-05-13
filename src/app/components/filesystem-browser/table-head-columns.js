/**
 * Implementation of table headers for filesystem-browser.
 *
 * @module components/filesystem-browser/table-head-columns
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableHeadColumns from 'oneprovider-gui/components/file-browser/fb-table-head-columns';

export default FbTableHeadColumns.extend({
  classNames: ['filesystem-table-head-columns'],

  /**
   * @override
   */
  i18nPrefix: 'components.filesystemBrowser.tableHeadColumns',
});
