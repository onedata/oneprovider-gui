import { resolve } from 'rsvp';

/**
 * Clears out localStorage model
 *
 * @module utils/clear-local-storage-model
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 *
 * @export
 * @function
 * @param {EmberData.Store} store
 * @returns {Promise<undefined, any>}
 */
export default function clearLocalStorageModel() {
  for (let i = 0; i < localStorage.length; ++i) {
    const key = localStorage.key(i);
    if (key.startsWith('oneprovider-gui:')) {
      localStorage.removeItem(key);
    }
  }
  return resolve();
}
