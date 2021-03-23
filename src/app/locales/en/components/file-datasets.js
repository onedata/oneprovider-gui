import inheritedDataset from './file-datasets/inherited-dataset';
import directDatasetSection from './file-datasets/direct-dataset-section';

// TODO: VFS-7479 this file is not-production-ready

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
  notAttachedReadonlyFlags: '[TODO: VFS-7479] (something lkie: Direct write protection can be enabled only if the file is marked as dataset.)',
  summaryParentsReadonlyFlags: '[TODO: VFS-7479] (this is summary of all parents protection - what does it mean; how you can change specific flags)',
  noParentDatasetsTip: '[TODO: VFS-7479] (why this list is empty and when parent datasets will appear on the list; what they will affect)',
  parentDatasetsTip: '[TODO: VFS-7479] (what is on the list and how these datasets and their protection flags affects this file; click to expand)',
  fileProtectionTag: {
    enabled: {
      data: 'Data of this {{fileType}} is write protected',
      metadata: 'Metadata of this {{fileType}} is write protected',
    },
    disabled: {
      data: 'Data of this {{fileType}} is writable',
      metadata: 'Metadata of this {{fileType}} is writable',
    },
  },
  fileProtectionTagTip: {
    enabled: {
      data: '[TODO: VFS-7479] (what does it mean that data of {{fileType}} is write protected)',
      metadata: '[TODO: VFS-7479] (what does it mean that metadata of {{fileType}} is write protected)',
    },
    disabled: {
      data: '[TODO: VFS-7479] (why we show that data of {{fileType}} is writable in contrast to write protection)',
      metadata: '[TODO: VFS-7479] (why we show that metadata of {{fileType}} is writable in contrast to write protection)',
    },
  },
  tableHeaders: {
    data: 'Data write&nbsp;protection',
    metadata: 'Metadata write&nbsp;protection',
  },
  cannotLoadAncestorDatasets: 'Could not load ancestor datasets list.',
  cannotLoadDirectDataset: 'Could not load direct dataset state.',
  cannotLoadFileDatasetSummary: 'Could not load dataset summary for selected element.',
  protectionHeaderHint: {
    data: '[TODO: VFS-7479] (what is forbidden when data is write protected; how single dataset protection affects the final dataset)',
    metadata: '[TODO: VFS-7479] (what is forbidden when metadata is write protected; how single dataset protection affects the final dataset)',
  },
  hint: {
    title: 'Datasets',
    intro: '[TODO: VFS-7479] (what datasets are; what are datasets in accordance to file or directory)',
    guide: '[TODO: VFS-7479] (what this modal shows and what can you configure here)',
    docLinkName: 'datasets',
    close: 'Close',
  },

  inheritedDataset,
  directDatasetSection,
};
