/**
 * Implementation of mobile table row part for archive-browser.
 *
 * @module components/archive-browser/table-row-mobile-secondary-info
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableRowMobileSecondaryInfo from 'oneprovider-gui/components/file-browser/fb-table-row-mobile-secondary-info';
import { reads } from '@ember/object/computed';

export default FbTableRowMobileSecondaryInfo.extend({
  classNames: ['archive-table-row-mobile-secondary-info'],

  /**
   * @override
   */
  i18nPrefix: 'components.archiveBrowser.tableRowMobileSecondaryInfo',

  archive: reads('fileRowModel.archive'),
});
