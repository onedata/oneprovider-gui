/**
 * Set global variables to inform user when WebSocket was exited abnormally
 *
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OnedataWebsocketErrorHandler from 'onedata-gui-websocket-client/services/onedata-websocket-error-handler';
import {
  GOING_AWAY,
} from 'onedata-gui-websocket-client/utils/websocket-close-event-codes';

export default OnedataWebsocketErrorHandler.extend({
  /**
   * @override
   *
   * @param {CloseEvent} closeEvent
   * @param {boolean} openingCompleted
   */
  abnormalClose(closeEvent, openingCompleted) {
    if (closeEvent && closeEvent.code === GOING_AWAY) {
      console.debug(
        'service:onedata-websocket-error-handler#abnormalClose: GOING_AWAY code, ignoring'
      );
    } else {
      this.setProperties({
        currentCloseEvent: closeEvent,
        currentOpeningCompleted: openingCompleted,
      });
    }
  },
});
