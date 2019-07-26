import _ from 'lodash';
import onedataCommonTranslations from './onedata-gui-common';

import aclEditor from './components/acl-editor';
import editPermissionsModal from './components/edit-permissions-modal';
import fileBrowser from './components/file-browser';
import posixPermissionsEditor from './components/posix-permissions-editor';

const translations = {
  components: {
    aclEditor,
    editPermissionsModal,
    fileBrowser,
    posixPermissionsEditor,
  },
};

export default _.merge({},
  onedataCommonTranslations,
  translations
);
