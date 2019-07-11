import _ from 'lodash';
import onedataCommonTranslations from './onedata-gui-common';

import fileBrowser from './components/file-browser';

const translations = {
  components: {
    fileBrowser,
  },
};

export default _.merge({},
  onedataCommonTranslations,
  translations
);
