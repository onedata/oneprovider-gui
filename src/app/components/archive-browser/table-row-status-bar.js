/**
 * Implementation of status part of table row part for archive-browser.
 *
 * @module components/archive-browser/table-row-status-bar
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableRowStatusBar from 'oneprovider-gui/components/file-browser/fb-table-row-status-bar';
import { equal, raw } from 'ember-awesome-macros';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default FbTableRowStatusBar.extend(I18n, {
  classNames: ['archive-table-row-status-bar'],

  /**
   * @override
   */
  i18nPrefix: 'components.archiveBrowser.tableRowStatusBar',

  /**
   * @type {ComputedProperty<Models.Archive>}
   */
  archive: reads('file'),

  hasDip: reads('fileRowModel.includeDip'),

  showBagitTag: equal('fileRowModel.archiveLayout', raw('bagit')),

  showFailedTag: reads('fileRowModel.isFailed'),
});
