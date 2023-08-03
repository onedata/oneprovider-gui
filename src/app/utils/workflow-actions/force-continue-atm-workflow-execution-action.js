/**
 * Forcefully continues workflow execution. It's possible only when execution is
 * in `failed` state. Forced continuation ignores last processed lane failure
 * and continues to the next lane.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Action from 'onedata-gui-common/utils/action';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { eq, raw, or, not } from 'ember-awesome-macros';
import { normalizeWorkflowStatus } from 'onedata-gui-common/utils/workflow-visualiser/statuses';

/**
 * @typedef {Object} ForceContinueAtmWorkflowExecutionActionContext
 * @property {Models.AtmWorkflowExecution|Models.AtmWorkflowExecutionSummary} atmWorkflowExecution
 */

export default Action.extend({
  workflowManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.workflowActions.forceContinueAtmWorkflowExecutionAction',

  /**
   * @override
   */
  className: 'force-continue-atm-workflow-execution-action-trigger',

  /**
   * @override
   */
  icon: 'play',

  /**
   * @override
   */
  buttonStyle: 'warning',

  /**
   * @override
   */
  disabled: or(not('isExecutionFailed'), not('executionHasLaneToContinue')),

  /**
   * @override
   */
  tip: computed('disabled', function tip() {
    if (!this.isExecutionFailed) {
      return this.t('disabledTip.onlyFailedExecution');
    } else if (!this.executionHasLaneToContinue) {
      return this.t('disabledTip.onlyForNonLastLane');
    }
    return null;
  }),

  /**
   * @type {ComputedProperty<Models.AtmWorkflowExecution|Models.AtmWorkflowExecutionSummary>}
   */
  atmWorkflowExecution: reads('context.atmWorkflowExecution'),

  /**
   * @type {ComputedProperty<AtmWorkflowExecutionStatus>}
   */
  executionStatus: computed('atmWorkflowExecution.status', function executionStatus() {
    return normalizeWorkflowStatus(this.get('atmWorkflowExecution.status'));
  }),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isExecutionFailed: eq('executionStatus', raw('failed')),

  /**
   * @type {ComputedProperty<boolean>}
   */
  executionHasLaneToContinue: computed(
    'atmWorkflowExecution.lanes',
    function executionHasLaneToContinue() {
      const laneStates = this.atmWorkflowExecution.lanes;
      if (!laneStates?.length) {
        // When detailed execution state (each lane execution state) is not available,
        // we assume optimistically that workflow continuation is possible. In the
        // worst case user will see a descriptive error in modal, that continuation
        // is not possible.
        return true;
      }

      const globalMaxRunNumber = laneStates.reduce(
        (foundMax, { runs }) =>
        Math.max(foundMax, ...runs.map(({ runNumber }) => runNumber)),
        0
      );
      const lastLaneMaxRunNumber = Math.max(
        ...laneStates[laneStates.length - 1].runs.map(({ runNumber }) => runNumber)
      );

      return lastLaneMaxRunNumber < globalMaxRunNumber;
    }
  ),

  /**
   * @override
   */
  async onExecute() {
    await this.forceContinueAtmWorkflowExecution();
  },

  async forceContinueAtmWorkflowExecution() {
    const atmWorkflowExecutionId = this.get('atmWorkflowExecution.entityId');
    if (!atmWorkflowExecutionId) {
      throw new Error('Unknown ID of atm. workflow execution.');
    }
    await this.workflowManager.forceContinueAtmWorkflowExecution(atmWorkflowExecutionId);
  },
});
