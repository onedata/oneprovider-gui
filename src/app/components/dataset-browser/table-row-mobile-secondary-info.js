/**
 * Implementation of mobile table row part for dataset-browser.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableRowMobileSecondaryInfo from 'oneprovider-gui/components/file-browser/fb-table-row-mobile-secondary-info';
import { computed } from '@ember/object';

export default FbTableRowMobileSecondaryInfo.extend({
  classNames: ['dataset-table-row-mobile-secondary-info'],

  /**
   * @override
   */
  i18nPrefix: 'components.datasetBrowser.tableRowMobileSecondaryInfo',

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
