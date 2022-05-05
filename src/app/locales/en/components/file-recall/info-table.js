export default {
  fileType: {
    file: 'file',
    dir: 'directory',
    symlink: 'symbolic link',
  },
  archive: 'Archive',
  dataset: 'Dataset',
  filesRecalled: 'Files recalled',
  dataRecalled: 'Data recalled',
  recallingProvider: 'Recalling Oneprovider',
  targetPath: 'Recall destination',
  relativePath: 'Relative location',
  startedAt: 'Started at',
  cancelledAt: 'Cancelled at',
  finishedAt: 'Finished at',
  filesFailed: 'Items failed',
  lastError: 'Last error',
  unknownError: 'Unknown error',
  processStatus: 'Status',
  labelTips: {
    recallingProvider: 'Oneprovider that is performing the recall. In the process, the archive data will be copied to its storages.',
    targetPath: 'Path to the root {{fileType}} of this recall.',
    relativePath: 'Relative path to this {{fileType}} from the root directory of this recall.',
    filesFailed: 'Number of files or directories which failed to be recalled due to errors.',
  },
  statisticNotAvailableTip: 'This statistic is available only on the recalling Oneprovider.',
  status: {
    scheduled: 'Scheduled',
    pending: 'Ongoing',
    cancelling: 'Cancelling',
    cancelled: 'Cancelled',
    succeeded: 'Finished successfully',
    failed: 'Finished with errors',
    unknown: 'Unknown',
  },
  percentageDone: '(recall progress: {{percentage}}%)',
  couldNotLoad: 'Could not load',
  rootDirectory: 'Root directory',
  currentOneprovider: 'current',
  errorLogText: {
    open: 'open',
    errorLog: 'error log',
    forDetails: 'for details',
  },
};
