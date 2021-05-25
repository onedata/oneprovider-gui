/**
 * Implementation of mobile table row part for archive-browser.
 *
 * @module components/archive-browser/table-row-mobile-info
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableRowMobileInfo from 'oneprovider-gui/components/file-browser/fb-table-row-mobile-info';

export default FbTableRowMobileInfo.extend({
  classNames: ['archive-table-row-mobile-info'],

  /**
   * @override
   */
  i18nPrefix: 'components.archiveBrowser.tableRowMobileInfo',
});
