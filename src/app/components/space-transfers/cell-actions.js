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
import { tag } from 'ember-awesome-macros';

const actionIcons = {
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
   * @virtual
   * @type {Array<Object>}
   */
  transferActions: undefined,

  /**
   * @type {boolean}
   */
  actionsOpened: false,

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  isCancelling: computed.reads('record.transfer.isCancelling'),

  /**
   * @type {Ember.ComputedProperty<boolean>}
   */
  transferFilesDeleted: computed.equal('record.transfer.dataSourceType', 'deleted'),

  /**
   * @type {ComputedProperty<String>}
   */
  message: computed.reads('record.actionMessage'),

  /**
   * @type {ComputedProperty<String>}
   */
  messageType: computed.reads('record.actionMessageType'),

  triggerClass: computed('elementId', function triggerClass() {
    return `actions-transfer-${this.get('elementId')}`;
  }),

  triggerSelector: tag `.${'triggerClass'}`,

  /**
   * @type {Ember.ComputedProperty<Ember.A<EmberObject>>}
   */
  menuActions: computed(
    'transferActions',
    'record.{isRerunning,transfer.isEnded}',
    'isCancelling',
    'transferFilesDeleted',
    function menuActions() {
      const transferActions = this.get('transferActions');
      if (transferActions) {
        const record = this.get('record');
        return A(transferActions
          .filter(({ id }) => !this.isActionInvisible(id))
          .map(({ id, action }) => EmberObject.create({
            title: this.t(id),
            // TODO: optimize - a function is created for each cell
            action: () => action(record),
            icon: actionIcons[id],
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

  actions: {
    toggleActions(open) {
      const _open = (typeof open === 'boolean') ? open : !this.get('actionsOpened');
      this.set('actionsOpened', _open);
    },
  },
});
