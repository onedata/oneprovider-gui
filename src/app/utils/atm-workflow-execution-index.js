/**
 * Compute record index for atm-workflow-execution model, concerning externally injected state
 *
 * @module utils/atm-workflow-execution-index
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { getProperties } from '@ember/object';

const backendEpochInfinity = 9999999999;

export default function atmWorkflowExecutionIndex(record, phase) {
  const {
    entityId,
    scheduleTime,
    finishTime,
  } = getProperties(record, 'entityId', 'scheduleTime', 'finishTime');

  const timestamp = phase === 'ended' ? finishTime : scheduleTime;
  return `${backendEpochInfinity - timestamp}${entityId}`;
}
