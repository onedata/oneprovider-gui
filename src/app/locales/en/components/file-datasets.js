import summaryHeader from './file-datasets/summary-header';
import directDatasetControl from './file-datasets/direct-dataset-control';
import { fileType } from './dataset-protection/-common';

export default {
  fileType,
  close: 'Close',
  noDataset: {
    text: 'This {{fileType}} does not belong to any dataset',
    buttonEstablish: 'Establish dataset here',
    // FIXME: tooltip or text with info
  },
  tabs: {
    settings: {
      fileType,
      label: 'Settings',
      tip: 'The selected {{fileType}} can be individually marked as a dataset with optional write protection settings. Please note that all ancestor datasets (ones that contain the {{fileType}}) are also considered when determining the effective write protection – presented in the top-right corner. This is depicted in the below table, which allows manipulating the settings for each dataset in the hierarchy.',
    },
    archives: {
      fileType,
      label: 'Archives',
      labelCounted: 'Archives ({{count}})',
      tip: 'Archive is a read-only, persistent snapshot of a dataset, created at a certain point in time. It contains both physical data and metadata from the dataset, stored as a copy within the space.',
      tipDisabled: 'This {{fileType}} is not marked as a dataset and cannot be archived.',
    },
  },
  summaryHeader,
  directDatasetControl,
};
