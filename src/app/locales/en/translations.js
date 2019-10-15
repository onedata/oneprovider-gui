import _ from 'lodash';
import onedataCommonTranslations from './onedata-gui-common';
import onedataWebsocketClientTranslations from './onedata-gui-websocket-client';

import aclEditor from './components/acl-editor';
import editPermissionsModal from './components/edit-permissions-modal';
import fileBrowser from './components/file-browser';
import posixPermissionsEditor from './components/posix-permissions-editor';
import fileDistributionModal from './components/file-distribution-modal';

import uploadManager from './services/upload-manager';

import handleMultiFilesOperation from './utils/handle-multi-files-operation';

const translations = {
  components: {
    aclEditor,
    editPermissionsModal,
    fileBrowser,
    posixPermissionsEditor,
    fileDistributionModal,
  },
  services: {
    uploadManager,
  },
  utils: {
    handleMultiFilesOperation,
  },
};

export default _.merge({},
  onedataCommonTranslations,
  onedataWebsocketClientTranslations,
  translations
);
