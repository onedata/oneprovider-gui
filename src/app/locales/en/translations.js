import _ from 'lodash';
import onedataCommonTranslations from './onedata-gui-common';

import modals from './components/modals';
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
import spaceAutomation from './components/space-automation';
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
import archiveFilesystemBrowser from './components/archive-filesystem-browser';
import datasetBrowser from './components/dataset-browser';
import archiveBrowser from './components/archive-browser';
import archiveSettings from './components/archive-settings';
import archivesPurge from './components/archives-purge';
import itemsSelectBrowser from './components/items-select-browser';
import datasetProtection from './components/dataset-protection';
import filePath from './components/file-path';
import archiveRecall from './components/archive-recall';
import recallInfoModal from './components/recall-info-modal';

import uploadManager from './services/upload-manager';

import handleMultiFilesOperation from './utils/handle-multi-files-operation';
import baseBrowserModel from './utils/base-browser-model';
import filesystemBrowserModel from './utils/filesystem-browser-model';
import datasetBrowserModel from './utils/dataset-browser-model';
import archiveBrowserModel from './utils/archive-browser-model';
import selectorFilesystemBrowserModel from './utils/selector-filesystem-browser-model';
import itemsSelectBrowserUtils from './utils/items-select-browser';
import workflowActions from './utils/workflow-actions';
import workflowVisualiser from './utils/workflow-visualiser';

const translations = {
  components: {
    modals,
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
    spaceAutomation,
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
    archiveFilesystemBrowser,
    datasetBrowser,
    archiveBrowser,
    archiveSettings,
    archivesPurge,
    itemsSelectBrowser,
    datasetProtection,
    filePath,
    archiveRecall,
    recallInfoModal,
  },
  services: {
    uploadManager,
  },
  utils: {
    handleMultiFilesOperation,
    baseBrowserModel,
    filesystemBrowserModel,
    datasetBrowserModel,
    archiveBrowserModel,
    selectorFilesystemBrowserModel,
    itemsSelectBrowser: itemsSelectBrowserUtils,
    workflowActions,
    workflowVisualiser,
  },
};

export default _.merge({},
  onedataCommonTranslations,
  translations
);
