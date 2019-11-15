/**
 * A cell component with transfer actions
 * 
 * @module components/space-transfers/cell-actions
 * @author Michal Borzecki
 * @copyright (C) 2018 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import EmberObject, { computed, get } from '@ember/object';
import { A } from '@ember/array';
import I18n from 'onedata-gui-common/mixins/components/i18n';

const ACTION_ICONS = {
  cancelTransfer: 'cancelled',
  rerunTransfer: 'rerun',
};

export default Component.extend(I18n, {
  classNames: ['cell-actions'],
  i18n: service(),

  /**
   * @virtual
   */
  i18nPrefix: 'components.spaceTransfers.cellActions',

  /**
   * ember-models-table record
   * @virtual
   * @type {Object}
   * - has actions property which is an array of objects
   */
  record: undefined,

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  isCancelling: computed.reads('record.transfer.isCancelling'),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  transferFilesDeleted: computed.equal('record.transfer.dataSourceType', 'deleted'),

  /**
   * @type {Ember.ComputedProperty<string>}
   */
  message: computed.reads('record.actionMessage'),

  /**
   * @type {Ember.ComputedProperty<string>}
   */
  messageType: computed.reads('record.actionMessageType'),

  /**
   * @type {Ember.ComputedProperty<Ember.A<EmberObject>>}
   */
  menuActions: computed(
    'record.{actions,isRerunning,transfer.isEnded}',
    'isCancelling',
    'transferFilesDeleted',
    function () {
      const actions = this.get('record.actions');
      if (actions) {
        const record = this.get('record');
        return A(actions
          .filter(({ id }) => !this.isActionInvisible(id))
          .map(({ id, action }) => EmberObject.create({
            title: this.t(id),
            // TODO: optimize - a function is created for each cell
            action: () => action(record),
            icon: ACTION_ICONS[id],
            disabled: this.isActionDisabled(id),
          }))
        );
      }
    }
  ),

  /**
   * Returns true if action should be hidden for this transfer
   * @param {string} actionId
   * @returns {boolean}
   */
  isActionInvisible(actionId) {
    const isTransferEnded = this.get('record.transfer.isEnded');
    switch (actionId) {
      case 'cancelTransfer':
        return isTransferEnded;
      case 'rerunTransfer':
        return !isTransferEnded;
    }
  },

  /**
   * Returns true if action cannot be performed for this transfer
   * @param {string} actionId
   * @returns {boolean}
   */
  isActionDisabled(actionId) {
    const {
      record,
      isCancelling,
      transferFilesDeleted,
    } = this.getProperties('record', 'isCancelling', 'transferFilesDeleted');
    switch (actionId) {
      case 'cancelTransfer':
        return isCancelling;
      case 'rerunTransfer':
        return transferFilesDeleted || get(record, 'isRerunning');
    }
  },
});
