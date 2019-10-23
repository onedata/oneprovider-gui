/**
 * Injects function for generating development model for onezone-gui
 *
 * @module routes/application
 * @author Jakub Liput, Michał Borzęcki
 * @copyright (C) 2017-2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { inject as service } from '@ember/service';
import OnedataApplicationRoute from 'onedata-gui-common/routes/application';
import DevelopmentModelRouteMixin from 'onedata-gui-websocket-client/mixins/routes/development-model';
import generateDevelopmentModel from 'oneprovider-gui/utils/generate-development-model';

export default OnedataApplicationRoute.extend(DevelopmentModelRouteMixin, {
  onedataWebsocket: service(),

  /**
   * @override
   */
  clearLocalStoragePrefix: 'oneprovider-gui:',

  developmentModelConfig: Object.freeze({
    clearOnReload: false,
  }),

  generateDevelopmentModel,

  beforeModel() {
    const superResult = this._super(...arguments);
    return this.get('onedataWebsocket.webSocketInitializedProxy')
      .catch(() => {
        throw {
          isOnedataCustomError: true,
          type: 'cannot-init-websocket',
        };
      })
      .then(() => superResult);
  },
});
