/**
 * Dataset-specific browser table columns.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableRowColumns from 'oneprovider-gui/components/file-browser/fb-table-row-columns';
import { reads } from '@ember/object/computed';

export default FbTableRowColumns.extend({
  /**
   * @type {Models.Dataset}
   */
  dataset: reads('file'),

  actions: {
    manageArchives() {
      const {
        invokeFileAction,
        dataset,
      } = this.getProperties('invokeFileAction', 'dataset');
      invokeFileAction(dataset, 'manageArchives');
    },
  },
});
