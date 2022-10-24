/**
 * Compute record index for atm-workflow-execution-summary model,
 * concerning externally injected state
 *
 * @module utils/atm-workflow-execution-summary-index
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { getProperties } from '@ember/object';
import reversedTimestamp from 'oneprovider-gui/utils/reversed-timestamp';
import { AtmWorkflowExecutionPhase } from 'onedata-gui-common/utils/workflow-visualiser/statuses';

export default function atmWorkflowExecutionIndex(record, phase) {
  const {
    entityId,
    scheduleTime,
    finishTime,
  } = getProperties(record, 'entityId', 'scheduleTime', 'finishTime');

  const timestamp = phase === AtmWorkflowExecutionPhase.Ended ? finishTime : scheduleTime;
  return `${reversedTimestamp(timestamp)}${entityId}`;
}
