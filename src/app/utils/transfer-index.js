/**
 * Compute record index for transfer model, concerning externally injected state
 *
 * @module utils/transfer-index
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { getProperties } from '@ember/object';
import reversedTimestamp from 'oneprovider-gui/utils/reversed-timestamp';

const linkNameIdPartLength = 6;

export default function transferIndex(record, state) {
  const {
    entityId,
    scheduleTime,
    finishTime,
  } = getProperties(record, 'entityId', 'scheduleTime', 'finishTime');
  const timestamp = state === 'ended' ? finishTime : scheduleTime;
  // "ip2" is a separator used with ids in database (the name was probably
  // a mistake and should be "id2", but it's not our business)
  const firstIdPartMatch = entityId.match(/(.*)(ip2.*)/);
  const idForIndex = firstIdPartMatch && firstIdPartMatch[1] || entityId;
  return `${reversedTimestamp(timestamp)}${(idForIndex).slice(0, linkNameIdPartLength)}`;
}
