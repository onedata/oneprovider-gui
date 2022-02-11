/**
 * Gets percentage(floored to integer) progress of recall process.
 * *NOTE: `archiveRecallState` and `archiveRecallInfo`should be resolved.
 *
 * @module utils/recalling-percentage-progress
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { get } from '@ember/object';

export default function recallingPercentageProgress(file) {
  const recallingMembership = file && get(file, 'recallingMembership');
  const isRecallInfoApplicable = Boolean(file && (
    get(file, 'isRecalled') ||
    recallingMembership === 'direct' ||
    recallingMembership === 'ancestor'
  ));
  if (isRecallInfoApplicable) {
    const archiveRecallState = get(file, 'archiveRecallState.content');
    const archiveRecallInfo = get(file, 'archiveRecallInfo.content');
    if (archiveRecallState && archiveRecallInfo) {
      const bytesCopied = get(archiveRecallState, 'bytesCopied') || 0;
      const totalByteSize = get(archiveRecallInfo, 'totalByteSize');
      if (totalByteSize) {
        return Math.floor(bytesCopied / totalByteSize * 100);
      }
    }
  }

  return null;
}
