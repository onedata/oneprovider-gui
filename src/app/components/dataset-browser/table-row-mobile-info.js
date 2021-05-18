/**
 * Implementation of mobile table row part for dataset-browser.
 *
 * @module components/dataset-browser/table-row-mobile-info
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableRowMobileInfo from 'oneprovider-gui/components/file-browser/fb-table-row-mobile-info';
import { computed } from '@ember/object';

export default FbTableRowMobileInfo.extend({
  classNames: ['dataset-table-row-mobile-info'],

  /**
   * @override
   */
  i18nPrefix: 'components.datasetBrowser.tableRowMobileInfo',

  /**
   * @type {ComputedProperty<SafeString>}
   */
  archiveCountText: computed('fileRowModel.archiveCount', function archiveCountText() {
    const count = this.get('fileRowModel.archiveCount');
    if (!count) {
      return this.t('archiveCount.none');
    } else if (count === 1) {
      return this.t('archiveCount.single');
    } else {
      return this.t('archiveCount.multi', { count });
    }
  }),
});
