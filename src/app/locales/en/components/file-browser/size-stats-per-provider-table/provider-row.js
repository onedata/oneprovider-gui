export default {
  fileCounters: {
    containsLabel: 'Contains',
    logicalSizeLabel: 'Logical size',
    physicalSizeLabel: 'Physical size',
    virtualSizeLabel: 'Virtual size',
    elementsCount: {
      template: '{{fileCount}} {{fileNoun}}, {{dirCount}} {{dirNoun}}',
      templateExtraInfo: ' ({{totalCount}} {{elementNoun}} in total)',
      file: {
        singular: 'file',
        plural: 'files',
      },
      dir: {
        singular: 'directory',
        plural: 'directories',
      },
      element: {
        singular: 'element',
        plural: 'elements',
      },
    },
    providerOccursErrorsTip: 'The provider has some files or directories in error state, i.e. they are not accessible due to some problems with the storage backend. The actual number of errors may be larger since it includes only the online providers with enabled directory size statistics.',
  },
};
