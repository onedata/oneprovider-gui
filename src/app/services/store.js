import OnedataWebsocketStore from 'onedata-gui-websocket-client/services/store';

export default OnedataWebsocketStore.extend({
  /**
   * @override 
   */
  userEntityType: 'op_user',

  /**
   * @override 
   */
  userScope: 'private',
});
