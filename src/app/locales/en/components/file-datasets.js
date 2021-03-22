import inheritedDataset from './file-datasets/inherited-dataset';
import directDatasetSection from './file-datasets/direct-dataset-section';

// TODO: VFS-7404 this file is not-production-ready

export default {
  fileType: {
    file: 'file',
    dir: 'directory',
  },
  datasets: 'Datasets',
  // TODO: VFS-7404 reuse data/metadata, remove redundancy
  protectionType: {
    lowercase: {
      data: 'data',
      metadata: 'metadata',
    },
    uppercase: {
      data: 'Data',
      metadata: 'Metadata',
    },
  },
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
  fileProtectionTag: {
    enabled: {
      data: 'Data of this {{fileType}} is write protected.',
      metadata: 'Metadata of this {{fileType}} is write protected.',
    },
    disabled: {
      data: 'Data of this {{fileType}} is writable.',
      metadata: 'Metadata of this {{fileType}} is writable.',
    },
  },
  fileProtectionTagTip: {
    enabled: {
      data: 'Data write protection causes all oprations to... TODO: VFS-7404',
      metadata: 'Metadata write protections causes all operations... TODO: VFS-7404',
    },
    disabled: {
      data: 'Settings of all effective datasets for this file does not add a write constraint... TODO: VFS-7404',
      metadata: 'Settings of all effective datasets for this file does not add a write constraint... TODO: VFS-7404',
    },
  },
  tableHeaders: {
    data: 'Data write&nbsp;protection',
    metadata: 'Metadata write&nbsp;protection',
  },

  inheritedDataset,
  directDatasetSection,
};
