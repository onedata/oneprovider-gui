/**
 * Customizes fetching user record of `service:current-user` for Oneprovider
 * 
 * @module servics/current-user
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import CurrentUserService from 'onedata-gui-websocket-client/services/current-user';
import { entityType as userEntityType } from 'oneprovider-gui/models/user';

export default CurrentUserService.extend({
  userEntityType,
});
