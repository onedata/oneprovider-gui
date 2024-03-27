import _ from 'lodash';
import onedataCommonTranslations from './onedata-gui-common';

import modals from './components/modals';
import aclEditor from './components/acl-editor';
import contentFileBrowser from './components/content-file-browser';
import contentSpaceDatasets from './components/content-space-datasets';
import fileBrowser from './components/file-browser';
import posixPermissionsEditor from './components/posix-permissions-editor';
import fileDistribution from './components/file-distribution';
import spaceTransfers from './components/space-transfers';
import spaceShares from './components/space-shares';
import spaceAutomation from './components/space-automation';
import dbViewModal from './components/db-view-modal';
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
import archiveProperties from './components/archive-properties';
import archiveCreate from './components/archive-create';
import archivesDelete from './components/archives-delete';
import itemsSelectBrowser from './components/items-select-browser';
import datasetProtection from './components/dataset-protection';
import filePath from './components/file-path';
import formattedPathString from './components/formatted-path-string';
import archiveRecall from './components/archive-recall';
import fileRecall from './components/file-recall';
import archiveContentCount from './components/archive-content-count';
import archiveState from './components/archive-state';
import archiveDetailsModal from './components/archive-details-modal';
import fileInfoModal from './components/file-info-modal';
import fileSize from './components/file-size';
import fileMetadata from './components/file-metadata';
import filePermissions from './components/file-permissions';
import fileShares from './components/file-shares';
import fileQos from './components/file-qos';
import archiveAuditLog from './components/archive-audit-log';
import fileCommon from './components/file-common';
import apiSamples from './components/api-samples';
import columnsConfigurationPopover from './components/columns-configuration-popover';
import columnsConfigurationCell from './components/columns-configuration-cell';
import visualEdm from './components/visual-edm';
import storageLocationPerProviderTable from './components/storage-location-per-provider-table';

import uploadManager from './services/upload-manager';

import handleMultiFilesOperation from './utils/handle-multi-files-operation';
import baseBrowserModel from './utils/base-browser-model';
import filesystemBrowserModel from './utils/filesystem-browser-model';
import datasetBrowserModel from './utils/dataset-browser-model';
import archiveBrowserModel from './utils/archive-browser-model';
import selectorFilesystemBrowserModel from './utils/selector-filesystem-browser-model';
import archiveFilesystemBrowserModel from './utils/archive-filesystem-browser-model';
import itemsSelectBrowserUtils from './utils/items-select-browser';
import workflowActions from './utils/workflow-actions';
import workflowVisualiser from './utils/workflow-visualiser';
import archiveFormBaseModel from './utils/archive-form/-base-model';
import archiveFormViewModel from './utils/archive-form/view-model';
import archiveFormCreateModel from './utils/archive-form/create-model';
import datasetActions from './utils/dataset/actions';
import fileInfo from './utils/file-info';
import fileMetadataViewModel from './utils/file-metadata-view-model';
import filePermissionsViewModel from './utils/file-permissions-view-model';
import fileQosViewModel from './utils/file-qos-view-model';
import fileDistributionViewModel from './utils/file-distribution-view-model';
import archivePropertiesViewModel from './utils/archive-properties-view-model';
import itemsTooltipContent from './utils/items-tooltip-content';

const translations = {
  components: {
    modals,
    aclEditor,
    contentFileBrowser,
    contentSpaceDatasets,
    fileBrowser,
    posixPermissionsEditor,
    fileDistribution,
    spaceTransfers,
    spaceShares,
    spaceAutomation,
    dbViewModal,
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
    archiveProperties,
    archiveCreate,
    archivesDelete,
    itemsSelectBrowser,
    datasetProtection,
    filePath,
    formattedPathString,
    archiveRecall,
    fileRecall,
    archiveContentCount,
    archiveState,
    archiveDetailsModal,
    fileInfoModal,
    fileSize,
    fileMetadata,
    filePermissions,
    fileShares,
    fileQos,
    archiveAuditLog,
    fileCommon,
    apiSamples,
    columnsConfigurationPopover,
    columnsConfigurationCell,
    visualEdm,
    storageLocationPerProviderTable,
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
    archiveFilesystemBrowserModel,
    itemsSelectBrowser: itemsSelectBrowserUtils,
    workflowActions,
    workflowVisualiser,
    fileMetadataViewModel,
    filePermissionsViewModel,
    fileQosViewModel,
    fileDistributionViewModel,
    fileInfo,
    archivePropertiesViewModel,
    itemsTooltipContent,
    archiveForm: {
      baseModel: archiveFormBaseModel,
      viewModel: archiveFormViewModel,
      createModel: archiveFormCreateModel,
    },
    dataset: {
      actions: datasetActions,
    },
  },
};

export default _.merge({},
  onedataCommonTranslations,
  translations
);
