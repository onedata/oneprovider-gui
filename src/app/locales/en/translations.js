import _ from 'lodash';
import onedataCommonTranslations from './onedata-gui-common';

import aclEditor from './components/acl-editor';
import editPermissionsModal from './components/edit-permissions-modal';
import fileBrowser from './components/file-browser';
import posixPermissionsEditor from './components/posix-permissions-editor';
import fileDistributionModal from './components/file-distribution-modal';
import websocketConnectionModal from './components/websocket-connection-modal';
import spaceTransfers from './components/space-transfers';
import dbViewModal from './components/db-view-modal';

import uploadManager from './services/upload-manager';

import handleMultiFilesOperation from './utils/handle-multi-files-operation';

const translations = {
  components: {
    aclEditor,
    editPermissionsModal,
    fileBrowser,
    posixPermissionsEditor,
    fileDistributionModal,
    websocketConnectionModal,
    spaceTransfers,
    dbViewModal,
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
  translations
);
