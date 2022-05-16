/**
 * Filesystem-specific browser table columns.
 *
 * @module components/filesystem-browser/table-row-columns
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableRowColumns from 'oneprovider-gui/components/file-browser/fb-table-row-columns';
import { raw, array } from 'ember-awesome-macros';
import { computed } from '@ember/object';

export default FbTableRowColumns.extend({
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
   * @type {DirSizeStatsConfig}
   */
  dirSizeStatsConfig: undefined,

  /**
   * @type {ComputedProperty<boolean>}
   */
  isDirSizeStatsStarted: array.includes(
    raw(['enabled', 'initializing']),
    'dirSizeStatsConfig.statsCollectionStatus'
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  tooltipText: computed(
    'dirSizeStatsConfig.statsCollectionStatus',
    function tooltipText() {
      const statsCollectionStatus = this.get('dirSizeStatsConfig.statsCollectionStatus');
      return this.t(statsCollectionStatus + 'StatsInfo');
    }
  ),

  actions: {
    invokeFileAction(file, btnId, ...args) {
      this.get('invokeFileAction')(file, btnId, ...args);
    },
  },
});
