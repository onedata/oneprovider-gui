import _ from 'lodash';
import onedataCommonTranslations from './onedata-gui-common';

import aclEditor from './components/acl-editor';
import editPermissionsModal from './components/edit-permissions-modal';
import contentFileBrowser from './components/content-file-browser';
import fileBrowser from './components/file-browser';
import posixPermissionsEditor from './components/posix-permissions-editor';
import fileDistributionModal from './components/file-distribution-modal';
import websocketConnectionModal from './components/websocket-connection-modal';
import spaceTransfers from './components/space-transfers';
import spaceShares from './components/space-shares';
import dbViewModal from './components/db-view-modal';
import qosModal from './components/qos-modal';

import uploadManager from './services/upload-manager';

import handleMultiFilesOperation from './utils/handle-multi-files-operation';

const translations = {
  components: {
    aclEditor,
    editPermissionsModal,
    contentFileBrowser,
    fileBrowser,
    posixPermissionsEditor,
    fileDistributionModal,
    websocketConnectionModal,
    spaceTransfers,
    spaceShares,
    dbViewModal,
    qosModal,
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
