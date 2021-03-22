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
  noParentDatasets: 'This file does not have any parent datasets.',
  parentDatasets: 'Parent datasets',
  notAttachedReadonlyFlags: 'Direct write protection can be enabled only if the file is marked as dataset.',
  summaryParentsReadonlyFlags: 'This is a summary write protection status of all parent datasets.<br>You can change flags for specific parent dataset in table below (expand the row to see full list).',
  noParentDatasetsTip: 'If any ancestor directory of this file is marked as a dataset, it will appear on this list and its write protection flags will affect effective write protection flag of dataset attached to this file.',
  tableHeaders: {
    data: 'Data write&nbsp;protection',
    metadata: 'Metadata write&nbsp;protection',
  },

  inheritedDataset,
  directDatasetSection,
};
