const fileType = {
  file: 'file',
  dir: 'directory',
};

export default {
  fileType,
  datasets: 'Datasets',
  close: 'Close',
  dataProtectedTag: 'Data is write protected',
  metadataProtectedTag: 'Metadata is write protected',
  // TODO: VFS-7404 tooltip UX, tooltip texts
  dataProtectedTooltip: 'Data protection prevents a file from...',
  metadataProtectedTooltip: 'Metadata protection prevents a file from...',
  inheritedDatasets: 'Inherited datasets',
  noInheritedDatasets: 'This file does not have inherited datasets',
  establishDataset: 'Establish dataset',

  // component
  directDatasetSection: {
    fileType,
    markAsDataset: 'Mark this {{fileType}} as dataset',
    dataProtection: 'Data write protection',
    metadataProtection: 'Metadata write protection',
  },
};
