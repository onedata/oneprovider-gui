import _ from 'lodash';
import onedataCommonTranslations from './onedata-gui-common';
import onedataWebsocketClientTranslations from './onedata-gui-websocket-client';

import fileBrowser from './components/file-browser';
import fileDistributionModal from './components/file-distribution-modal';

import uploadManager from './services/upload-manager';

const translations = {
  components: {
    fileBrowser,
    fileDistributionModal,
  },
  services: {
    uploadManager,
  },
};

export default _.merge({},
  onedataCommonTranslations,
  onedataWebsocketClientTranslations,
  translations
);
