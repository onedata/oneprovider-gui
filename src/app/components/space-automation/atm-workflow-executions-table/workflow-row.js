/**
 * Shows single workflow executions table row.
 *
 * @module components/space-automation/atm-workflow-executions-table/workflow-row
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { collect } from '@ember/object/computed';
import { tag } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { scheduleOnce } from '@ember/runloop';
import isDirectlyClicked from 'onedata-gui-common/utils/is-directly-clicked';
import {
  normalizeWorkflowStatus,
  translateWorkflowStatus,
  workflowEndedStatuses,
} from 'onedata-gui-common/utils/workflow-visualiser/statuses';

export default Component.extend(I18n, {
  tagName: 'tr',
  classNames: ['workflow-row', 'data-row'],
  attributeBindings: ['atmWorkflowExecutionSummary.entityId:data-row-id'],

  i18n: service(),
  workflowManager: service(),

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
  wasCancelledByUser: false,

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
      case 'preparing':
      case 'enqueued':
        return 'time';
      case 'active':
        return 'update';
      case 'aborting':
      case 'cancelled':
        return 'cancelled';
      case 'skipped':
        return 'skipped';
      case 'finished':
        return 'checkbox-filled';
      case 'failed':
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
  cancelAction: computed('status', 'wasCancelledByUser', function cancelAction() {
    const status = this.get('atmWorkflowExecutionSummary.status');
    const wasCancelledByUser = this.get('wasCancelledByUser');
    const disabled = wasCancelledByUser || [
      'aborting',
      ...workflowEndedStatuses,
    ].includes(status);
    return {
      title: this.t('cancel'),
      class: 'cancel-atm-workflow-execution-action-trigger',
      icon: 'cancelled',
      disabled,
      action: () => this.cancelAtmWorkflowExecution(),
    };
  }),

  /**
   * @type {ComputedProperty<Array<Utils.Action>>}
   */
  atmWorkflowExecutionActions: collect('cancelAction'),

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

  async cancelAtmWorkflowExecution() {
    this.set('wasCancelledByUser', true);
    const {
      workflowManager,
      onCancel,
    } = this.getProperties('workflowManager', 'onCancel');
    const atmWorkflowExecutionId = this.get('atmWorkflowExecutionSummary.entityId');
    await workflowManager.cancelAtmWorkflowExecution(atmWorkflowExecutionId);
    onCancel && onCancel();
  },

  actions: {
    toggleActionsOpen(state) {
      scheduleOnce('afterRender', this, 'set', 'areActionsOpened', state);
    },
  },
});
