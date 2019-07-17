import _ from 'lodash';
import onedataCommonTranslations from './onedata-gui-common';

import fileBrowser from './components/file-browser';
import posixPermissionsEditor from './components/posix-permissions-editor';

const translations = {
  components: {
    fileBrowser,
    posixPermissionsEditor,
  },
};

export default _.merge({},
  onedataCommonTranslations,
  translations
);
