/**
 * Cancels workflow execution.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Action from 'onedata-gui-common/utils/action';
import ActionResult from 'onedata-gui-common/utils/action-result';
import { computed, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import {
  normalizeWorkflowStatus,
  workflowEndedStatuses,
} from 'onedata-gui-common/utils/workflow-visualiser/statuses';
import { reject } from 'rsvp';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';

const nonCancellableStatuses = workflowEndedStatuses;

export default Action.extend({
  workflowManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.workflowActions.cancelAtmWorkflowExecutionAction',

  /**
   * @override
   */
  className: 'cancel-atm-workflow-execution-action-trigger',

  /**
   * @override
   */
  icon: 'cancelled',

  /**
   * @type {String}
   */
  buttonStyle: 'danger',

  /**
   * @type {Boolean}
   */
  hasBeenExecuted: false,

  /**
   * @override
   */
  disabled: computed('executionStatus', 'hasBeenExecuted', function disabled() {
    const {
      hasBeenExecuted,
      executionStatus,
    } = this.getProperties('hasBeenExecuted', 'executionStatus');

    return hasBeenExecuted || nonCancellableStatuses.includes(executionStatus);
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

  executionStatusObserver: observer('executionStatus', function executionStatusObserver() {
    if (this.hasBeenExecuted && this.executionStatus !== 'stopping') {
      this.set('hasBeenExecuted', false);
    }
  }),

  /**
   * @override
   */
  onExecute() {
    this.set('hasBeenExecuted', true);
    const result = ActionResult.create();
    return result.interceptPromise(this.cancelAtmWorkflowExecution())
      .then(() => result)
      .catch(() => {
        safeExec(this, () => this.set('hasBeenExecuted', false));
        return result;
      });
  },

  async cancelAtmWorkflowExecution() {
    const workflowManager = this.get('workflowManager');
    const atmWorkflowExecutionId = this.get('atmWorkflowExecution.entityId');
    if (!atmWorkflowExecutionId) {
      return reject();
    }
    await workflowManager.cancelAtmWorkflowExecution(atmWorkflowExecutionId);
  },
});
