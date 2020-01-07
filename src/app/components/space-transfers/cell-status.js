/**
 * A cell component with transfer representation used by `transfers-table` component.
 * 
 * @module components/space-transfers/cell-status
 * @author Michal Borzecki
 * @copyright (C) 2017 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: 'span',
  classNames: ['cell-icon', 'cell-status'],
  classNameBindings: ['_status'],
  i18n: service(),

  /**
   * @virtual
   */
  i18nPrefix: 'components.spaceTransfers.cellStatus',

  /** 
   * @virtual
   * @type {TransferTableRecord}
   */
  record: undefined,

  /**
   * Transfer status.
   * @type {ComputedProperty<string>}
   */
  transferStatus: reads('record.status'),

  /**
   * @type {ComputedProperty<boolean|undefined>}
   */
  isCancelling: reads('record.transfer.isCancelling'),

  /**
   * @type {ComputedProperty<string>}
   */
  _status: computed('transferStatus', 'isCancelling', function _status() {
    if (this.get('isCancelling')) {
      return 'aborting';
    } else {
      return this.get('transferStatus');
    }
  }),

  /**
   * Status icon.
   * @type {ComputedProperty<string>}
   */
  _icon: computed('_status', function _icon() {
    switch (this.get('_status')) {
      case 'completed':
        return 'checkbox-filled';
      case 'skipped':
        return 'skipped';
      case 'aborting':
      case 'cancelled':
        return 'cancelled';
      case 'failed':
        return 'checkbox-filled-x';
      case 'replicating':
      case 'evicting':
        return 'update';
      case 'scheduled':
      case 'enqueued':
        return 'time';
    }
  }),

  /**
   * Status tooltip content.
   * @type {ComputedProperty<string>}
   */
  _hint: computed('_status', function _hint() {
    return this.t(this.get('_status'));
  }),
});
