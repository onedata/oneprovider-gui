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
    providerOccursErrorsTip: 'Errors occurred while calculating statistics for some files or directories on this provider, e.g. because they were not accessible due to problems with the storage backend.',
    providerOfflineTip: 'Statistics from this provider could not be retrieved, so its values are not included in the totals.',
    dirStatsDisabledTip: 'Directory size statistics are disabled on this provider, so its values are not included in the totals.',
  },
};
