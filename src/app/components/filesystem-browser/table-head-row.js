/**
 * Implementation of table headers for filesystem-browser.
 *
 * @module components/filesystem-browser/table-head-row
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableHeadRow from 'oneprovider-gui/components/file-browser/fb-table-head-row';
import { reads } from '@ember/object/computed';

export default FbTableHeadRow.extend({
  classNames: ['filesystem-table-head-row'],

  /**
   * @override
   */
  i18nPrefix: 'components.filesystemBrowser.tableHeadRow',

  /**
   * @type {ComputedProperty<string>}
   */
  jumpControlValue: reads('browserModel.jumpControlValue'),

  actions: {
    changeJumpControlValue(value) {
      this.get('browserModel').changeJumpControlValue(value);
    },
  },
});
