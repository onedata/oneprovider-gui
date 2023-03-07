/**
 * Exposes ArchiveRecallState proxy only if it is known that current user has
 * privilege to fetch it.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { get, computed } from '@ember/object';
import { promise } from 'ember-awesome-macros';

export default function computedArchiveRecallStateProxy(
  infoProxyName = 'archiveRecallInfoProxy',
  stateProxyName = 'internalArchiveRecallStateProxy',
) {
  return promise.object(computed(
    infoProxyName,
    stateProxyName,
    async function archiveRecallStateProxy() {
      const archiveRecallInfo = await this.get(infoProxyName);
      if (!get(archiveRecallInfo, 'isOnLocalProvider')) {
        throw {
          onedataCustomError: true,
          type: 'archive-recall-state-not-available',
        };
      } else {
        return await this.get(stateProxyName);
      }
    }
  ));
}
