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
import { camelize } from '@ember/string';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import { underscore } from '@ember/string';

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
   * @virtual
   * @type {Object}
   */
  forbiddenOperations: Object.freeze({}),

  /**
   * @virtual
   * @type {Boolean}
   */
  ownedByCurrentUser: false,

  /**
   * @type {boolean}
   */
  actionsOpened: false,

  /**
   * The last calculated menu actions for specific arguments. Allows to reuse
   * the already calculated actions in case of no real change in the component
   * properties.
   * @type {{memoArgs: Array<unknown>, actions: Ember.A<Utils.Action>}|null}
   */
  memoizedMenuActions: null,

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
   * @type {Ember.ComputedProperty<Ember.A<Utils.Action>>}
   */
  menuActions: computed(
    'transferActions',
    'record.{isRerunning,transfer.isEnded}',
    'isCancelling',
    'transferFilesDeleted',
    'forbiddenOperations',
    function menuActions() {
      return this.getMenuActions();
    }
  ),

  /**
   * Generates menu actions. Uses memoization to avoid recalculations.
   * @returns {Ember.A<Utils.Action>}
   */
  getMenuActions() {
    const {
      memoizedMenuActions,
      transferActions,
      record,
      isCancelling,
      transferFilesDeleted,
      forbiddenOperations,
    } = this.getProperties(
      'memoizedMenuActions',
      'transferActions',
      'record',
      'isCancelling',
      'transferFilesDeleted',
      'forbiddenOperations',
    );
    const isRerunning = this.get('record.isRerunning');
    const isEnded = this.get('record.transfer.isEnded');
    const memoArgs = [
      transferActions,
      isRerunning,
      isEnded,
      isCancelling,
      transferFilesDeleted,
      forbiddenOperations,
    ];

    if (
      memoizedMenuActions &&
      memoizedMenuActions.memoArgs.every((arg, idx) => arg === memoArgs[idx])
    ) {
      return memoizedMenuActions.actions;
    }

    if (transferActions) {
      const actions = A(
        transferActions
        .filter(({ id }) => !this.isActionInvisible(id))
        .map(({ id, action }) => {
          const forbiddenTip = this.actionForbiddenTip(id);
          const isDisabled = this.isActionDisabled(id);
          return EmberObject.create({
            title: this.t(id),
            action: () => action(record),
            icon: actionIcons[id],
            disabled: isDisabled || Boolean(forbiddenTip),
            tip: (forbiddenTip && !isDisabled) ? forbiddenTip : undefined,
          });
        })
      );
      this.set('memoizedMenuActions', {
        memoArgs,
        actions,
      });
      return actions;
    }
  },

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
    } = this.getProperties(
      'record',
      'isCancelling',
      'transferFilesDeleted',
    );
    switch (actionId) {
      case 'cancelTransfer':
        return isCancelling;
      case 'rerunTransfer':
        return transferFilesDeleted || get(record, 'isRerunning');
    }
  },

  actionForbiddenTip(actionId) {
    const {
      i18n,
      ownedByCurrentUser,
      forbiddenOperations,
      record,
    } = this.getProperties('i18n', 'ownedByCurrentUser', 'forbiddenOperations', 'record');
    const operationAction = actionId.split('Transfer')[0] === 'rerun' ?
      'schedule' : 'cancel';
    if (operationAction === 'cancel' && ownedByCurrentUser) {
      return false;
    } else {
      const transferType = get(record, 'transfer.type');
      const forbiddensToCheck = transferType === 'migration' ? [
        `${operationAction}Replication`,
        `${operationAction}Eviction`,
      ] : [camelize(`${operationAction}-${transferType}`)];
      const isForbidden = forbiddensToCheck
        .map(flag => forbiddenOperations[flag])
        .some(i => i);
      if (isForbidden) {
        return insufficientPrivilegesMessage({
          i18n,
          modelName: 'space',
          privilegeFlag: forbiddensToCheck.map(flag => `space_${underscore(flag)}`),
        });
      } else {
        return null;
      }
    }
  },

  actions: {
    toggleActions(open) {
      const _open = (typeof open === 'boolean') ? open : !this.get('actionsOpened');
      this.set('actionsOpened', _open);
    },
  },
});
