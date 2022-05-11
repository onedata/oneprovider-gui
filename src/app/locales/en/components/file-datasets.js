import summaryHeader from './file-datasets/summary-header';
import directDatasetControl from './file-datasets/direct-dataset-control';
import { fileType } from './dataset-protection/-common';

export default {
  fileType,
  close: 'Close',
  establishingDataset: 'establishing dataset',
  noDataset: {
    header: 'This {{fileType}} does not belong to any dataset',
    text: 'You may establish a new dataset on this {{fileType}}.',
    buttonEstablish: 'Establish dataset',
  },
  showInBrowser: 'Show in dataset browser',
  tabs: {
    settings: {
      fileType,
      label: 'Settings',
      tip: 'Settings for selected {{fileType}} in the context of datasets, with the possibility to establish a dataset on it and manipulate write protection settings. Please note that all ancestor datasets (ones that contain the {{fileType}}) are also considered when determining the effective write protection, which is presented in the top-right corner. The dataset hierarchy is depicted in the below table, which allows manipulating the settings on each level.',
    },
    archives: {
      fileType,
      label: 'Archives',
      labelCounted: 'Archives ({{count}})',
      tip: 'Archive is a read-only, persistent snapshot of a dataset, created at a certain point in time. It contains both physical data and metadata from the dataset, stored as a copy within the space.',
      tipDisabled: 'This {{fileType}} is not a dataset and cannot be archived.',
    },
  },
  summaryHeader,
  directDatasetControl,
};
