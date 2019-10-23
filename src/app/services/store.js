import OnedataWebsocketStore from 'onedata-gui-websocket-client/services/store';
import { entityType as userEntityType } from 'oneprovider-gui/models/user';

export default OnedataWebsocketStore.extend({
  /**
   * @override 
   */
  userEntityType,

  /**
   * @override 
   */
  userScope: 'private',
});
