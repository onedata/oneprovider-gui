import OnedataAdapter from 'onedata-gui-websocket-client/adapters/application';
import { entityType as userEntityType } from 'oneprovider-gui/models/user';

export const entityTypeToModelNameMap = Object.freeze(new Map([
  ['op_group', 'group'],
  ['op_space', 'space'],
  ['op_transfer', 'transfer'],
  [userEntityType, 'user'],
]));

export default OnedataAdapter.extend({
  /**
   * @override
   */
  subscribe: false,

  /**
   * @override
   */
  createScope: 'private',

  /**
   * @override
   */
  entityTypeToModelNameMap,
});
