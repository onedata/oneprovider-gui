/**
 * Provides workflows manipulation functions ready to use for GUI.
 *
 * @module services/workflow-actions
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service from '@ember/service';
import CancelAtmWorkflowExecutionAction from 'oneprovider-gui/utils/workflow-actions/cancel-atm-workflow-execution-action';

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
});
