/**
 * Table columns (th) for archive browser
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableHeadRow from 'oneprovider-gui/components/file-browser/fb-table-head-row';

export default FbTableHeadRow.extend({
  classNames: ['archive-table-head-row'],

  /**
   * @override
   */
  i18nPrefix: 'components.archiveBrowser.tableHeadRow',
});
