/**
 * Filesystem-specific browser table columns.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableRowColumns from 'oneprovider-gui/components/file-browser/fb-table-row-columns';
import { raw, array, promise, or, eq, and } from 'ember-awesome-macros';
import { LegacyFileType } from 'onedata-gui-common/utils/file';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { htmlSafe } from '@ember/string';

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
   * @type {ComputedProperty<boolean>}
   */
  isItemDirStatsFeatureHidden: or(
    'browserModel.isDirStatsFeatureHidden',
    eq('file.effFile.type', raw(LegacyFileType.SymbolicLink))
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

  /**
   * @type {ComputedProperty<PromiseObject<Models.User>>}
   */
  ownerProxy: promise.object(computed('file.owner', async function ownerProxy() {
    return await this.fileManager.getFileOwner(this.file);
  })),

  /**
   * @type {Models.User}
   */
  owner: reads('ownerProxy.content'),

  /**
   * @type {Object}
   */
  errorReasonForOwnerProxy: reads('ownerProxy.reason'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isSmallReplicationRate: computed(
    'file.effFile.localReplicationRate',
    function isSmallReplicationRate() {
      const replicationRate = this.file.effFile.localReplicationRate * 100;
      return replicationRate > 0 && replicationRate < 1;
    }
  ),

  /**
   * @type {ComputedProperty<number|null>}
   */
  replicationRate: computed(
    'file.effFile.localReplicationRate',
    'isSmallReplicationRate',
    function replicationRate() {
      if (!isNaN(this.file.effFile.localReplicationRate)) {
        const replicationRate = this.file.effFile.localReplicationRate * 100;
        if (this.isSmallReplicationRate) {
          return replicationRate;
        }
        return Math.round(replicationRate);
      }
      return null;
    }
  ),

  /**
   * @type {ComputedProperty<string>}
   */
  replicationStyle: computed(
    'replicationRate',
    'isSmallReplicationRate',
    function replicationStyle() {
      if (this.isSmallReplicationRate) {
        return htmlSafe('width: 100%');
      }
      return htmlSafe(`width: ${this.replicationRate}%`);
    }
  ),

  /**
   * @type {ComputedProperty<string>}
   */
  emptyBarStyle: computed(
    'replicationRate',
    'isSmallReplicationRate',
    function emptyBarStyle() {
      if (this.isSmallReplicationRate) {
        return htmlSafe('width: 0%');
      }
      const left = 100 - this.replicationRate;
      return htmlSafe(`width: ${left}%`);
    }
  ),

  actions: {
    invokeFileAction(file, btnId, ...args) {
      this.get('invokeFileAction')(file, btnId, ...args);
    },
  },
});
