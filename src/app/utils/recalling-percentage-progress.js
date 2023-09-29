/**
 * Gets percentage (floored to integer) progress of recall process.
 * *NOTE:* `archiveRecallState` and `archiveRecallInfo` should be resolved.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { get } from '@ember/object';

const emptyValue = null;

export default function recallingPercentageProgress(file) {
  const recallingMembership = file && get(file, 'recallingMembership');
  // FIXME: custom property use
  const isRecallInfoApplicable = Boolean(file && (
    get(file, 'isRecalled') ||
    recallingMembership === 'direct' ||
    recallingMembership === 'ancestor'
  ));
  if (!isRecallInfoApplicable) {
    return emptyValue;
  }
  const archiveRecallInfo = get(file, 'archiveRecallInfo.isLoaded') &&
    get(file, 'archiveRecallInfo.content');
  if (!archiveRecallInfo || !get(archiveRecallInfo, 'isOnLocalProvider')) {
    return emptyValue;
  }

  const archiveRecallState = get(file, 'archiveRecallState.isLoaded') &&
    get(file, 'archiveRecallState.content');
  if (!archiveRecallState) {
    return emptyValue;
  }

  const bytesCopied = get(archiveRecallState, 'bytesCopied') || 0;
  const totalByteSize = get(archiveRecallInfo, 'totalByteSize');

  if (!totalByteSize) {
    return emptyValue;
  }

  return Math.floor(bytesCopied / totalByteSize * 100);
}
