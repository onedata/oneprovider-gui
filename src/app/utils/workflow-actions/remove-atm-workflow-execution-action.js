/**
 * Removes workflow execution.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Action from 'onedata-gui-common/utils/action';
import ActionResult from 'onedata-gui-common/utils/action-result';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import {
  normalizeWorkflowStatus,
  workflowEndedStatuses,
} from 'onedata-gui-common/utils/workflow-visualiser/statuses';
import { reject } from 'rsvp';

export default Action.extend({
  workflowManager: service(),
  modalManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.workflowActions.removeAtmWorkflowExecutionAction',

  /**
   * @override
   */
  className: 'remove-atm-workflow-execution-action-trigger',

  /**
   * @override
   */
  icon: 'x',

  /**
   * @type {string}
   */
  buttonStyle: 'danger',

  /**
   * @override
   */
  disabled: computed('executionStatus', function disabled() {
    return !workflowEndedStatuses.includes(this.executionStatus);
  }),

  /**
   * @override
   */
  tip: computed('disabled', function tip() {
    if (this.disabled) {
      return this.t('disabledTip');
    }
  }),

  /**
   * @type {ComputedProperty<Models.AtmWorkflowExecution|Models.AtmWorkflowExecutionSummary>}
   */
  atmWorkflowExecution: reads('context.atmWorkflowExecution'),

  /**
   * @type {ComputedProperty<String>}
   */
  executionStatus: computed('atmWorkflowExecution.status', function executionStatus() {
    return normalizeWorkflowStatus(this.get('atmWorkflowExecution.status'));
  }),

  /**
   * @override
   */
  async onExecute() {
    const atmWorkflowSchemaName = get(this.atmWorkflowExecution, 'name') ??
      get(await get(this.atmWorkflowExecution, 'atmWorkflowSchemaSnapshot'), 'name');

    const result = ActionResult.create();
    await this.modalManager.show('question-modal', {
      headerIcon: 'sign-warning-rounded',
      headerText: this.t('modalHeader'),
      descriptionParagraphs: [{
        text: this.t('modalDescription', {
          atmWorkflowSchemaName,
        }),
      }],
      yesButtonText: this.t('modalYes'),
      yesButtonType: 'danger',
      onSubmit: () =>
        result.interceptPromise(this.removeAtmWorkflowExecution()),
    }).hiddenPromise;

    result.cancelIfPending();
    return result;
  },

  async removeAtmWorkflowExecution() {
    const atmWorkflowExecutionId = this.get('atmWorkflowExecution.entityId');
    if (!atmWorkflowExecutionId) {
      return reject();
    }
    const batchResult = await this.workflowManager
      .removeAtmWorkflowExecutions([atmWorkflowExecutionId]) ?? {};
    const singleResult = Object.values(batchResult)[0];
    if (!singleResult?.success) {
      throw singleResult?.error;
    }
  },
});
