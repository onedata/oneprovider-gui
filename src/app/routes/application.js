/**
 * Injects function for generating development model for onezone-gui
 *
 * @author Jakub Liput, Michał Borzęcki
 * @copyright (C) 2017-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { inject as service } from '@ember/service';
import OnedataApplicationRoute from 'onedata-gui-common/routes/application';
import DevelopmentModelRouteMixin from 'onedata-gui-websocket-client/mixins/routes/development-model';
import UnifiedGuiController from 'onedata-gui-common/utils/unified-gui-controller';

export default OnedataApplicationRoute.extend(DevelopmentModelRouteMixin, {
  onedataWebsocket: service(),
  mockBackend: service(),
  providerManager: service(),

  /**
   * @override
   */
  clearLocalStoragePrefix: 'oneprovider-gui:',

  developmentModelConfig: Object.freeze({
    clearOnReload: true,
  }),

  generateDevelopmentModel() {
    return this.get('mockBackend').generateDevelopmentModel();
  },

  async beforeModel() {
    const superPromise = this._super(...arguments);
    if (UnifiedGuiController.shouldRedirectToOnezone()) {
      const providerId = this.get('providerManager').getCurrentProviderId();
      const path = `#/onedata/providers/${providerId}`;
      UnifiedGuiController.redirectToOnezone(path);
      return;
    }
    try {
      await this.get('onedataWebsocket.webSocketInitializedProxy');
    } catch (error) {
      throw {
        isOnedataCustomError: true,
        type: 'cannot-init-oneprovider-websocket',
      };
    }
    return await superPromise;
  },
});
