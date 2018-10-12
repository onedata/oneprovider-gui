/**
 * Injects function for generating development model for onepanel-gui
 *
 * @module routes/application
 * @author Jakub Liput, Michal Borzecki
 * @copyright (C) 2017-2018 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OnedataApplicationRoute from 'onedata-gui-common/routes/application';
import DevelopmentModelRouteMixin from 'onedata-gui-websocket-client/mixins/routes/development-model';
import generateDevelopmentModel from 'oneprovider-gui/utils/generate-development-model';
import clearLocalStorageModel from 'oneprovider-gui/utils/clear-local-storage-model';

export default OnedataApplicationRoute.extend(DevelopmentModelRouteMixin, {
  developmentModelConfig: Object.freeze({
    clearOnReload: false,
  }),
  generateDevelopmentModel,
  clearDevelopmentModel: clearLocalStorageModel,
});
