/**
 * Filesystem-specific browser table columns.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableRowColumns from 'oneprovider-gui/components/file-browser/fb-table-row-columns';
import { raw, array, promise } from 'ember-awesome-macros';
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
   * @type {ComputedProperty<number>}
   */
  replicationRate: computed(function replicationRate() {
    const replicationRate = this.file.effFile.replication * 100;
    if (replicationRate > 0 && replicationRate < 1) {
      return replicationRate;
    }
    return Math.round(replicationRate);
  }),

  /**
   * @type {ComputedProperty<string>}
   */
  replicationStyle: computed(function replicationStyle() {
    if (this.replicationRate > 0 && this.replicationRate < 1) {
      return htmlSafe('width: 100%');
    }
    return htmlSafe(`width: ${this.replicationRate}%`);
  }),

  /**
   * @type {ComputedProperty<string>}
   */
  emptyBarStyle: computed(function emptyBarStyle() {
    if (this.replicationRate > 0 && this.replicationRate < 1) {
      return htmlSafe('width: 0%');
    }
    const left = 100 - this.replicationRate;
    return htmlSafe(`width: ${left}%`);
  }),

  actions: {
    invokeFileAction(file, btnId, ...args) {
      this.get('invokeFileAction')(file, btnId, ...args);
    },
  },
});
