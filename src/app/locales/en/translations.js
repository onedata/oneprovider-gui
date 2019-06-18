import fileBrowser from './components/file-browser';
import _ from 'lodash';
import onedataCommonTranslations from './onedata-gui-common';

const translations = {
  components: {
    fileBrowser,
  },
};

export default _.merge({},
  onedataCommonTranslations,
  translations
);
