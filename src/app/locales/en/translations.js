import fileBrowser from './components/file-browser';

import fileActions from './services/file-actions';

import _ from 'lodash';
import onedataCommonTranslations from './onedata-gui-common';

const translations = {
  components: {
    fileBrowser,
  },
  services: {
    fileActions,
  },
};

export default _.merge({},
  onedataCommonTranslations,
  translations
);
