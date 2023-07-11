/**
 * Filesystem - specific browser table cell for size.
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import layout from 'oneprovider-gui/templates/components/filesystem-browser/table-size-cell';
import { LegacyFileType } from 'onedata-gui-common/utils/file';
import { raw, or, eq, and } from 'ember-awesome-macros';
import { computed } from '@ember/object';

export default Component.extend({
  layout,
  tagName: 'span',
  classNames: ['file-item-text'],

  /**
   * @override
   */
  i18nPrefix: 'components.filesystemBrowser.tableSizeCell',

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
  isItemDirStatsFeatureHidden: or(
    'browserModel.isDirStatsFeatureHidden',
    eq('file.effFile.type', raw(LegacyFileType.SymbolicLink))
  ),

  /**
   * If true, then instead of number, the placeholder will be rendered in place of size.
   * @type {ComputedProperty<boolean>}
   */
  isUnknownSizeShown: or(
    and(
      'browserModel.isDirSizeAlwaysHidden',
      eq('file.effFile.type', raw(LegacyFileType.Directory))
    ),
    eq('file.effFile.size', raw(null))
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  tooltipText: computed(
    'dirStatsServiceState.status',
    function tooltipText() {
      let dirStatsServiceStatus = this.get('dirStatsServiceState.status');
      if (dirStatsServiceStatus === 'stopping') {
        dirStatsServiceStatus = 'disabled';
      }
      return this.t(dirStatsServiceStatus + 'StatsInfo', {}, { defaultValue: '' });
    }
  ),

  actions: {
    invokeFileAction(file, btnId, ...args) {
      this.get('invokeFileAction')(file, btnId, ...args);
    },
  },
});
