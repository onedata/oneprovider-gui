/**
 * Shows single workflow executions table row.
 *
 * @module components/space-automation/atm-workflow-executions-table/workflow-row
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { collect } from '@ember/object/computed';
import { tag } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { scheduleOnce } from '@ember/runloop';
import isDirectlyClicked from 'onedata-gui-common/utils/is-directly-clicked';
import {
  normalizeWorkflowStatus,
  translateWorkflowStatus,
} from 'onedata-gui-common/utils/workflow-visualiser/statuses';

export default Component.extend(I18n, {
  tagName: 'tr',
  classNames: ['workflow-row', 'data-row'],
  attributeBindings: ['atmWorkflowExecutionSummary.entityId:data-row-id'],

  i18n: service(),
  workflowActions: service(),
  clipboardActions: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceAutomation.atmWorkflowExecutionsTable.workflowRow',

  /**
   * @virtual
   * @type {Models.AtmWorkflowExecutionSummary}
   */
  atmWorkflowExecutionSummary: undefined,

  /**
   * @virtual
   * @type {Array<String>}
   */
  columns: undefined,

  /**
   * @virtual
   * @type {Function}
   * @param {Models.AtmWorkflowExecutionSummary}
   * @returns {any}
   */
  onSelect: undefined,

  /**
   * @virtual
   * @type {Function}
   * @returns {any}
   */
  onCancel: undefined,

  /**
   * @type {Boolean}
   */
  areActionsOpened: false,

  /**
   * @type {ComputedProperty<String>}
   */
  actionsTriggerId: tag `actions-trigger-${'elementId'}`,

  /**
   * @type {ComputedProperty<String>}
   */
  status: computed('atmWorkflowExecutionSummary.status', function status() {
    return normalizeWorkflowStatus(this.get('atmWorkflowExecutionSummary.status'));
  }),

  /**
   * @type {ComputedProperty<String>}
   */
  statusIcon: computed('status', function statusIcon() {
    switch (this.get('status')) {
      case 'scheduled':
      case 'resuming':
        return 'time';
      case 'active':
        return 'update';
      case 'stopping':
      case 'interrupted':
      case 'cancelled':
      case 'paused':
        return 'cancelled';
      case 'finished':
        return 'checkbox-filled';
      case 'failed':
      case 'crashed':
        return 'checkbox-filled-x';
      case 'unknown':
      default:
        return 'unknown';
    }
  }),

  /**
   * @type {ComputedProperty<String>}
   */
  statusTooltip: computed('status', function statusTooltip() {
    const {
      i18n,
      status,
    } = this.getProperties('i18n', 'status');
    return translateWorkflowStatus(i18n, status);
  }),

  /**
   * @type {ComputedProperty<Utils.Action>}
   */
  cancelAction: computed('atmWorkflowExecutionSummary', function cancelAction() {
    const {
      workflowActions,
      atmWorkflowExecutionSummary,
    } = this.getProperties('workflowActions', 'atmWorkflowExecutionSummary');
    const action = workflowActions.createCancelAtmWorkflowExecutionAction({
      atmWorkflowExecution: atmWorkflowExecutionSummary,
    });
    action.addExecuteHook(result => {
      if (result && get(result, 'status') !== 'done') {
        return;
      }
      const onCancel = this.get('onCancel');
      onCancel && onCancel();
    });
    return action;
  }),

  /**
   * @type {Ember.ComputedProperty<Action>}
   */
  copyIdAction: computed('atmWorkflowExecutionSummary', function copyIdAction() {
    const {
      atmWorkflowExecutionSummary,
      clipboardActions,
    } = this.getProperties('atmWorkflowExecutionSummary', 'clipboardActions');

    return clipboardActions.createCopyRecordIdAction({
      record: atmWorkflowExecutionSummary,
    });
  }),

  /**
   * @type {ComputedProperty<Array<Utils.Action>>}
   */
  atmWorkflowExecutionActions: collect('cancelAction', 'copyIdAction'),

  click(event) {
    this._super(...arguments);
    if (isDirectlyClicked(event, this.get('element'))) {
      this.notifyAboutSelection();
    }
  },

  notifyAboutSelection() {
    const {
      atmWorkflowExecutionSummary,
      onSelect,
    } = this.getProperties('atmWorkflowExecutionSummary', 'onSelect');
    onSelect && onSelect(atmWorkflowExecutionSummary);
  },

  actions: {
    toggleActionsOpen(state) {
      scheduleOnce('afterRender', this, 'set', 'areActionsOpened', state);
    },
  },
});
