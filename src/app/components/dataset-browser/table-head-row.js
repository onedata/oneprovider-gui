/**
 * Table columns (th) for dataset browser
 *
 * @module components/dataset-browser
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableHeadRow from 'oneprovider-gui/components/file-browser/fb-table-head-row';

export default FbTableHeadRow.extend({
  classNames: ['dataset-table-head-row'],

  /**
   * @override
   */
  i18nPrefix: 'components.datasetBrowser.tableHeadRow',
});
