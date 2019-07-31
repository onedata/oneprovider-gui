import _ from 'lodash';
import onedataCommonTranslations from './onedata-gui-common';

import fileBrowser from './components/file-browser';
import fileDistributionModal from './components/file-distribution-modal';

const translations = {
  components: {
    fileBrowser,
    fileDistributionModal,
  },
};

export default _.merge({},
  onedataCommonTranslations,
  translations
);
