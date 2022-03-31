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
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default FbTableRowSecondaryInfo.extend(I18n, {
  classNames: ['archive-table-row-secondary-info'],

  /**
   * @override
   */
  i18nPrefix: 'components.archiveBrowser.tableRowSecondaryInfo',

  /**
   * @type {Utils.BrowsableArchive}
   */
  archive: reads('file'),
});
