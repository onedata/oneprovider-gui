import _ from 'lodash';
import onedataCommonTranslations from './onedata-gui-common';
import onedataWebsocketClientTranslations from './onedata-gui-websocket-client';

import fileBrowser from './components/file-browser';

import uploadManager from './services/upload-manager';

const translations = {
  components: {
    fileBrowser,
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
