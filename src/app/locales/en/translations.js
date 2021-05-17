import _ from 'lodash';
import onedataCommonTranslations from './onedata-gui-common';

import aclEditor from './components/acl-editor';
import editPermissionsModal from './components/edit-permissions-modal';
import contentFileBrowser from './components/content-file-browser';
import contentSpaceDatasets from './components/content-space-datasets';
import fileBrowser from './components/file-browser';
import posixPermissionsEditor from './components/posix-permissions-editor';
import fileDistributionModal from './components/file-distribution-modal';
import websocketConnectionModal from './components/websocket-connection-modal';
import spaceTransfers from './components/space-transfers';
import spaceShares from './components/space-shares';
import dbViewModal from './components/db-view-modal';
import qosModal from './components/qos-modal';
import fileDatasets from './components/file-datasets';
import contentEndpointError from './components/content-endpoint-error';
import modalFileSubheader from './components/modal-file-subheader';
import singleFileInfo from './components/single-file-info';
import shareShow from './components/share-show';
import qosExpressionInfo from './components/qos-expression-info';
import qosEvaluationInfo from './components/qos-evaluation-info';
import queryBuilder from './components/query-builder';
import filesystemBrowser from './components/filesystem-browser';
import datasetBrowser from './components/dataset-browser';
import archiveSettings from './components/archive-settings';

import uploadManager from './services/upload-manager';

import handleMultiFilesOperation from './utils/handle-multi-files-operation';
import baseBrowserModel from './utils/base-browser-model';
import filesystemBrowserModel from './utils/filesystem-browser-model';
import datasetBrowserModel from './utils/dataset-browser-model';

const translations = {
  components: {
    aclEditor,
    editPermissionsModal,
    contentFileBrowser,
    contentSpaceDatasets,
    fileBrowser,
    posixPermissionsEditor,
    fileDistributionModal,
    websocketConnectionModal,
    spaceTransfers,
    spaceShares,
    dbViewModal,
    qosModal,
    fileDatasets,
    contentEndpointError,
    modalFileSubheader,
    singleFileInfo,
    shareShow,
    qosExpressionInfo,
    qosEvaluationInfo,
    queryBuilder,
    filesystemBrowser,
    datasetBrowser,
    archiveSettings,
  },
  services: {
    uploadManager,
  },
  utils: {
    handleMultiFilesOperation,
    baseBrowserModel,
    filesystemBrowserModel,
    datasetBrowserModel,
  },
};

export default _.merge({},
  onedataCommonTranslations,
  translations
);
