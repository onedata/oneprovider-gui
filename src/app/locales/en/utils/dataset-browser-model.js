import BaseBrowserModel from './base-browser-model';
import _ from 'lodash';

export default _.merge({}, BaseBrowserModel, {
  currentDataset: 'Current dataset',
  spaceDatasets: 'Space datasets',
  datasetId: 'dataset ID',
  fileType: {
    file: 'file',
    dir: 'directory',
  },
  fileActions: {
    showFile: 'Show in file browser',
    manageArchives: 'Manage archives',
    protection: 'Write protection',
  },
  protection: {
    loadingRootFile: 'loading dataset root file',
  },
});
