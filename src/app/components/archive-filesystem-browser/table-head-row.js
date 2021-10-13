/**
 * Implementation of table headers for archive-filesystem-browser.
 *
 * @module components/archive-filesystem-browser/table-head-row
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FilesystemTableHeadRow from 'oneprovider-gui/components/filesystem-browser/table-head-row';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { or, raw } from 'ember-awesome-macros';

export default FilesystemTableHeadRow.extend({
  classNames: ['archive-filesystem-table-head-row'],

  /**
   * @override
   */
  i18nPrefix: 'components.archiveFilesystemBrowser.tableHeadRow',

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
