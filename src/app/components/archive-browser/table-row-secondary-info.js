/**
 * Displays description of archive.
 *
 * @module components/archive-browser/table-row-secondary-info
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableRowSecondaryInfo from 'oneprovider-gui/components/file-browser/fb-table-row-secondary-info';
import { reads } from '@ember/object/computed';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default FbTableRowSecondaryInfo.extend({
  classNames: ['archive-table-row-secondary-info'],

  /**
   * @virtual optional
   * @type {Function}
   */
  changeFileNameHover: notImplementedIgnore,

  /**
   * @type {Utils.BrowsableArchive}
   */
  archive: reads('file'),

  actions: {
    changeFileNameHover() {
      return this.changeFileNameHover(...arguments);
    },
  },
});
