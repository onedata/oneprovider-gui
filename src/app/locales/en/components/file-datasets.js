import inheritedDataset from './file-datasets/inherited-dataset';
import directDatasetSection from './file-datasets/direct-dataset-section';

// TODO: VFS-7404 this file is not-production-ready

export default {
  fileType: {
    file: 'file',
    dir: 'directory',
  },
  datasets: 'Datasets',
  close: 'Close',
  dataProtectedTag: 'Data is write protected',
  metadataProtectedTag: 'Metadata is write protected',
  dataProtectedTooltip: 'Data protection prevents a file from...',
  metadataProtectedTooltip: 'Metadata protection prevents a file from...',
  inheritedDatasets: 'Inherited datasets',
  noInheritedDatasets: 'This file does not have inherited datasets',
  establishDataset: 'Establish dataset',
  establishingDataset: 'establishing dataset',

  inheritedDataset,
  directDatasetSection,
};
