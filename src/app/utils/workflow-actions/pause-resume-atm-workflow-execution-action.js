/**
 * Pauses or resumes workflow execution (depending on it's current status).
 *
 * @author Michał Borzęcki
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Action from 'onedata-gui-common/utils/action';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { or } from 'ember-awesome-macros';
import {
  normalizeWorkflowStatus,
  workflowEndedStatuses,
  workflowSuspendedStatuses,
} from 'onedata-gui-common/utils/workflow-visualiser/statuses';
import ActionResult from 'onedata-gui-common/utils/action-result';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';

export default Action.extend({
  workflowManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.workflowActions.pauseResumeAtmWorkflowExecutionAction',

  /**
   * @override
   */
  className: 'pause-resume-atm-workflow-execution-action-trigger',

  /**
   * @type {boolean}
   */
  isBeingExecuted: false,

  /**
   * @override
   */
  icon: computed('operation', function icon() {
    return this.operation === 'resume' ? 'play' : 'pause';
  }),

  /**
   * @override
   */
  disabled: or('isIllegalPause', 'isBeingExecuted'),

  /**
   * @override
   */
  title: computed('operation', function title() {
    return this.t(`title.${this.operation}`);
  }),

  /**
   * @type {ComputedProperty<Models.AtmWorkflowExecution|Models.AtmWorkflowExecutionSummary>}
   */
  atmWorkflowExecution: reads('context.atmWorkflowExecution'),

  /**
   * @override
   */
  tip: computed('isIllegalPause', function tip() {
    return this.isIllegalPause ?
      this.t('disabledTip.noPauseWhenWorkflowNotWorking') :
      null;
  }),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isIllegalPause: computed(
    'operation',
    'executionStatus',
    function isIllegalPause() {
      return this.operation === 'pause' && (
        workflowEndedStatuses.includes(this.executionStatus) ||
        this.executionStatus === 'stopping'
      );
    }
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  executionStatus: computed('atmWorkflowExecution.status', function executionStatus() {
    return normalizeWorkflowStatus(this.atmWorkflowExecution.status);
  }),

  /**
   * @type {ComputedProperty<'pause'|'resume'>}
   */
  operation: computed('executionStatus', function operation() {
    return workflowSuspendedStatuses.includes(this.executionStatus) ?
      'resume' : 'pause';
  }),

  /**
   * @override
   */
  onExecute() {
    this.set('isBeingExecuted', true);
    const actionResult = ActionResult.create();
    actionResult.additionalData = {
      operation: this.operation,
    };

    const operationPromise = this.operation === 'resume' ?
      this.resumeAtmWorkflowExecution() :
      this.pauseAtmWorkflowExecution();

    return actionResult.interceptPromise(operationPromise)
      .then(() => actionResult)
      .catch(() => actionResult)
      .finally(() => safeExec(this, () => this.set('isBeingExecuted', false)));
  },

  /**
   * @override
   */
  getFailureNotificationActionName(actionResult) {
    const operation = this.getOperationFromActionResult(actionResult);
    return this.t(`failureNotificationActionName.${operation}`);
  },

  /**
   * @returns {Promise<void>}
   */
  async pauseAtmWorkflowExecution() {
    const atmWorkflowExecutionId = this.get('atmWorkflowExecution.entityId');
    if (!atmWorkflowExecutionId) {
      throw new Error('Cannot pause workflow execution due to undefined execution ID.');
    }
    await this.workflowManager.pauseAtmWorkflowExecution(atmWorkflowExecutionId);
  },

  /**
   * @returns {Promise<void>}
   */
  async resumeAtmWorkflowExecution() {
    const atmWorkflowExecutionId = this.get('atmWorkflowExecution.entityId');
    if (!atmWorkflowExecutionId) {
      throw new Error('Cannot resume workflow execution due to undefined execution ID.');
    }
    await this.workflowManager.resumeAtmWorkflowExecution(atmWorkflowExecutionId);
  },

  /**
   * @param {Utils.ActionResult} actionResult
   * @returns {'pause'|'resume'}
   */
  getOperationFromActionResult(actionResult) {
    return actionResult?.additionalData?.operation === 'resume' ?
      'resume' : 'pause';
  },
});
