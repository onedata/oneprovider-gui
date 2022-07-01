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
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';

export default FbTableRowColumns.extend(I18n, {
  i18n: service(),

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
    'dirSizeStatsConfig.dirStatsCollectingStatus'
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  tooltipText: computed(
    'dirSizeStatsConfig.dirStatsCollectingStatus',
    function tooltipText() {
      let dirStatsCollectingStatus = this.get('dirSizeStatsConfig.dirStatsCollectingStatus');
      if (dirStatsCollectingStatus === 'stopping') {
        dirStatsCollectingStatus = 'disabled';
      }
      return this.t(dirStatsCollectingStatus + 'StatsInfo', {}, { defaultValue: '' });
    }
  ),

  actions: {
    invokeFileAction(file, btnId, ...args) {
      this.get('invokeFileAction')(file, btnId, ...args);
    },
  },
});
