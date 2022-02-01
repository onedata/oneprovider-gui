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
      const currentBytes = get(archiveRecallState, 'currentBytes') || 0;
      const targetBytes = get(archiveRecallInfo, 'targetBytes');
      if (targetBytes) {
        return Math.floor(currentBytes / targetBytes * 100);
      }
    }
  }

  return null;
}
