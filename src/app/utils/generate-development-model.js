/**
 * Create and save example records for oneprovider-gui using store
 *
 * @module utils/generate-development-model
 * @author Jakub Liput
 * @copyright (C) 2018 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 *
 */

import userGri from 'onedata-gui-websocket-client/utils/user-gri';

const USER_ID = 'stub_user_id';
const USERNAME = 'Stub User';

/**
 * @export
 * @function
 * @param {EmberData.Store} store
 * @returns {Promise<undefined, any>}
 */
export default function generateDevelopmentModel(store) {
  return createUserRecord(store);
}

function createUserRecord(store) {
  return store.createRecord('user', {
    id: userGri(USER_ID),
    name: USERNAME,
  }).save();
}
