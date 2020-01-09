import OnedataAdapter from 'onedata-gui-websocket-client/adapters/application';
import { entityType as userEntityType } from 'oneprovider-gui/models/user';
import { entityType as groupEntityType } from 'oneprovider-gui/models/group';
import { entityType as spaceEntityType } from 'oneprovider-gui/models/space';
import { entityType as transferEntityType } from 'oneprovider-gui/models/transfer';
import { entityType as handleEntityType } from 'oneprovider-gui/models/handle';
import { entityType as shareEntityType } from 'oneprovider-gui/models/share';

export const entityTypeToModelNameMap = Object.freeze(new Map([
  [groupEntityType, 'group'],
  [spaceEntityType, 'space'],
  [transferEntityType, 'transfer'],
  [userEntityType, 'user'],
  [handleEntityType, 'handle'],
  [shareEntityType, 'share'],
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
