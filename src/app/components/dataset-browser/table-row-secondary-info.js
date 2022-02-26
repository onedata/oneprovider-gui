/**
 * Displays path of dataset root file.
 *
 * @module components/dataset-browser/table-row-secondary-info
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableRowSecondaryInfo from 'oneprovider-gui/components/file-browser/fb-table-row-secondary-info';
import { reads } from '@ember/object/computed';

export default FbTableRowSecondaryInfo.extend({
  classNames: ['dataset-table-row-secondary-info'],

  /**
   * @type {Utils.BrowsableDataset}
   */
  dataset: reads('file'),
});
