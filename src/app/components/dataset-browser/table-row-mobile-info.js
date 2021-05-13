/**
 * Implementation of mobile table row part for dataset-browser.
 *
 * @module components/dataset-browser/table-row-mobile-info
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableRowMobileInfo from 'oneprovider-gui/components/file-browser/fb-table-row-mobile-info';

export default FbTableRowMobileInfo.extend({
  classNames: ['dataset-table-row-mobile-info'],

  /**
   * @virtual
   * @type {Object}
   */
  fileRowModel: undefined,
});
