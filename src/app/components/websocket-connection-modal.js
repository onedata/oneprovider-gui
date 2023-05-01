/**
 * Error message shown when the WebSocket connection is lost
 *
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import { notEmpty } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { Promise } from 'rsvp';
import globals from 'onedata-gui-common/utils/globals';

export default Component.extend(I18n, {
  onedataWebsocketErrorHandler: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.websocketConnectionModal',

  open: notEmpty('currentCloseEvent'),
  currentCloseEvent: reads('onedataWebsocketErrorHandler.currentCloseEvent'),
  currentOpeningCompleted: reads('onedataWebsocketErrorHandler.currentCloseEvent'),

  actions: {
    reload() {
      return new Promise(() => {
        globals.location.reload();
      });
    },
  },
});
