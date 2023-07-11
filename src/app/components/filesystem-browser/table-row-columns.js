/**
 * Filesystem-specific browser table columns.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableRowColumns from 'oneprovider-gui/components/file-browser/fb-table-row-columns';
import { raw, array } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

export default FbTableRowColumns.extend(I18n, {
  i18n: service(),
  fileManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.filesystemBrowser.tableRowColumns',

  /**
   * @virtual
   * @type {Object}
   */
  fileRowModel: undefined,

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual
   * @type {DirStatsServiceState}
   */
  dirStatsServiceState: undefined,

  /**
   * @type {ComputedProperty<boolean>}
   */
  isDirStatsServiceStarted: array.includes(
    raw(['enabled', 'initializing']),
    'dirStatsServiceState.status'
  ),

  actions: {
    invokeFileAction(file, btnId, ...args) {
      this.get('invokeFileAction')(file, btnId, ...args);
    },
  },
});
