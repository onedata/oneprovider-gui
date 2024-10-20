/**
 * Shows single workflow executions table row.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2021-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { collect } from '@ember/object/computed';
import { tag } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/i18n';
import { inject as service } from '@ember/service';
import { scheduleOnce } from '@ember/runloop';
import isDirectlyClicked from 'onedata-gui-common/utils/is-directly-clicked';
import {
  normalizeWorkflowStatus,
  translateWorkflowStatus,
} from 'onedata-gui-common/utils/workflow-visualiser/statuses';
import {
  destroyDestroyableComputedValues,
  destroyableComputed,
  initDestroyableCache,
} from 'onedata-gui-common/utils/destroyable-computed';

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
   * @type {(operation: AtmWorkflowExecutionLifecycleChangingOperation) => void}
   * @returns {any}
   */
  onLifecycleChange: undefined,

  /**
   * @type {Boolean}
   */
  areActionsOpened: false,

  /**
   * @type {ComputedProperty<String>}
   */
  actionsTriggerId: tag`actions-trigger-${'elementId'}`,

  /**
   * @type {ComputedProperty<string>}
   */
  conflictLabel: computed(
    'atmWorkflowExecutionSummary.entityId',
    function conflictLabel() {
      return this.atmWorkflowExecutionSummary.entityId.slice(0, 4);
    }
  ),

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
        return 'checkbox-filled-x';
      case 'crashed':
        return 'checkbox-filled-warning';
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
  cancelAction: destroyableComputed(
    'atmWorkflowExecutionSummary',
    function cancelAction() {
      const {
        workflowActions,
        atmWorkflowExecutionSummary,
      } = this.getProperties('workflowActions', 'atmWorkflowExecutionSummary');
      const action = workflowActions.createCancelAtmWorkflowExecutionAction({
        atmWorkflowExecution: atmWorkflowExecutionSummary,
      });
      action.addExecuteHook((result) => {
        if (result?.status === 'done') {
          this.onLifecycleChange?.('cancel');
        }
      });
      return action;
    }
  ),

  /**
   * @type {ComputedProperty<Utils.Action>}
   */
  forceContinueAction: destroyableComputed(
    'atmWorkflowExecutionSummary',
    function forceContinueAction() {
      const action = this.workflowActions.createForceContinueAtmWorkflowExecutionAction({
        atmWorkflowExecution: this.atmWorkflowExecutionSummary,
      });
      action.addExecuteHook((result) => {
        if (result?.status === 'done') {
          this.onLifecycleChange?.('forceContinue');
        }
      });
      return action;
    }
  ),

  /**
   * @type {ComputedProperty<Utils.Action>}
   */
  pauseResumeAction: destroyableComputed(
    'atmWorkflowExecutionSummary',
    function pauseResumeAction() {
      const action = this.workflowActions
        .createPauseResumeAtmWorkflowExecutionAction({
          atmWorkflowExecution: this.atmWorkflowExecutionSummary,
        });
      action.addExecuteHook((result) => {
        if (result?.status === 'done') {
          this.onLifecycleChange?.(result?.additionalData?.operation);
        }
      });
      return action;
    }
  ),

  /**
   * @type {ComputedProperty<Utils.Action>}
   */
  removeAction: destroyableComputed(
    'atmWorkflowExecutionSummary',
    function removeAction() {
      const action = this.workflowActions.createRemoveAtmWorkflowExecutionAction({
        atmWorkflowExecution: this.atmWorkflowExecutionSummary,
      });
      action.addExecuteHook((result) => {
        if (result?.status === 'done') {
          this.onLifecycleChange?.('remove');
        }
      });
      return action;
    }
  ),

  /**
   * @type {Ember.ComputedProperty<Action>}
   */
  copyIdAction: destroyableComputed(
    'atmWorkflowExecutionSummary',
    function copyIdAction() {
      return this.clipboardActions.createCopyRecordIdAction({
        record: this.atmWorkflowExecutionSummary,
      });
    }
  ),

  /**
   * @type {ComputedProperty<Array<Utils.Action>>}
   */
  atmWorkflowExecutionActions: collect(
    'pauseResumeAction',
    'cancelAction',
    'forceContinueAction',
    'removeAction',
    'copyIdAction',
  ),

  init() {
    initDestroyableCache(this);
    this._super(...arguments);
  },

  /**
   * @override
   */
  willDestroy() {
    try {
      destroyDestroyableComputedValues(this);
    } finally {
      this._super(...arguments);
    }
  },

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
