/**
 * Filesystem-specific browser table columns.
 *
 * @module components/filesystem-browser/table-row-columns
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableRowColumns from 'oneprovider-gui/components/file-browser/fb-table-row-columns';

export default FbTableRowColumns.extend({
  /**
   * @override
   */
  i18nPrefix: 'components.filesystemBrowser.tableRowColumns',

  /**
   * @virtual
   * @type {Object}
   */
  fileRowModel: undefined,

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  actions: {
    invokeFileAction(file, btnId, ...args) {
      this.get('invokeFileAction')(file, btnId, ...args);
    },
  },
});
