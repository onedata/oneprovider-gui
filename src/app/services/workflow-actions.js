/**
 * Provides workflows manipulation functions ready to use for GUI.
 *
 * @author Michał Borzęcki
 * @copyright (C) 2021-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service from '@ember/service';
import CancelAtmWorkflowExecutionAction from 'oneprovider-gui/utils/workflow-actions/cancel-atm-workflow-execution-action';
import PauseResumeAtmWorkflowExecutionAction from 'oneprovider-gui/utils/workflow-actions/pause-resume-atm-workflow-execution-action';
import RemoveAtmWorkflowExecutionAction from 'oneprovider-gui/utils/workflow-actions/remove-atm-workflow-execution-action';

export default Service.extend({
  /**
   * @param {Object} context context specification:
   *   ```
   *   {
   *     atmWorkflowExecution: Models.AtmWorkflowExecution|Models.AtmWorkflowExecutionSummary,
   *   }
   *   ```
   * @returns {Utils.WorkflowActions.CancelAtmWorkflowExecutionAction}
   */
  createCancelAtmWorkflowExecutionAction(context) {
    return CancelAtmWorkflowExecutionAction.create({ ownerSource: this, context });
  },

  /**
   * @param {Object} context context specification:
   *   ```
   *   {
   *     atmWorkflowExecution: Models.AtmWorkflowExecution|Models.AtmWorkflowExecutionSummary,
   *   }
   *   ```
   * @returns {Utils.WorkflowActions.PauseResumeAtmWorkflowExecutionAction}
   */
  createPauseResumeAtmWorkflowExecutionAction(context) {
    return PauseResumeAtmWorkflowExecutionAction.create({ ownerSource: this, context });
  },

  /**
   * @param {Object} context context specification:
   *   ```
   *   {
   *     atmWorkflowExecution: Models.AtmWorkflowExecution|Models.AtmWorkflowExecutionSummary,
   *   }
   *   ```
   * @returns {Utils.WorkflowActions.RemoveAtmWorkflowExecutionAction}
   */
  createRemoveAtmWorkflowExecutionAction(context) {
    return RemoveAtmWorkflowExecutionAction.create({ ownerSource: this, context });
  },
});
