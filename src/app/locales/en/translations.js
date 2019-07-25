import _ from 'lodash';
import onedataCommonTranslations from './onedata-gui-common';

import aclEditor from './components/acl-editor';
import fileBrowser from './components/file-browser';
import posixPermissionsEditor from './components/posix-permissions-editor';

const translations = {
  components: {
    aclEditor,
    fileBrowser,
    posixPermissionsEditor,
  },
};

export default _.merge({},
  onedataCommonTranslations,
  translations
);
