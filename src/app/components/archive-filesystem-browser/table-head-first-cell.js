/**
 * Implementation of table first cell for archive-filesystem-browser.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableHeadFirstCell from 'oneprovider-gui/components/file-browser/fb-table-head-first-cell';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { or, raw } from 'ember-awesome-macros';

export default FbTableHeadFirstCell.extend({
  /**
   * @type {ComputedProperty<Boolean>}
   */
  renderArchiveDipSwitch: or(
    'browserModel.renderArchiveDipSwitch',
    raw(false)
  ),

  /**
   * One of: aip, dip.
   * @type {ComputedProperty<String>}
   */
  archiveDipMode: or(
    'browserModel.archiveDipMode',
    raw('aip')
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isArchiveDipAvailable: or(
    'browserModel.isArchiveDipAvailable',
    raw(false),
  ),

  /**
   * @type {ComputedProperty<Function>}
   */
  onArchiveDipModeChange: or(
    'browserModel.onArchiveDipModeChange',
    raw(notImplementedThrow)
  ),
});
