import transfersOverview from './space-transfers/transfers-overview';
import throughputDistribution from './space-transfers/throughput-distribution';
import providerSelector from './space-transfers/provider-selector';
import transferChart from './space-transfers/transfer-chart';

export default {
  scheduledTransfers: 'Waiting',
  activeTransfers: 'Ongoing',
  completedTransfers: 'Ended',
  onTheFlyTransfers: 'On-the-fly',
  noTransfers: {
    file: 'There are no transfers for selected file or directory',
    scheduled: 'There are no waiting transfers',
    current: 'There are no ongoing transfers',
    completed: 'There are no ended transfers',
  },
  initializingTransfers: 'Initializing transfers...',
  in: 'Input',
  out: 'Output',
  fileHistoryLimitReached: 'History limit per file reached',
  fileNotExists: 'Selected file or directory does not exist',
  liveTableStats: {
    type: 'Type',
    path: 'File/directory',
    userName: 'Username',
    destination: 'Destination',
    scheduledAt: 'Scheduled at',
    startedAt: 'Started at',
    finishedAt: 'Finished at',
    totalBytes: 'Replicated',
    totalFiles: 'Processed files',
    status: 'Status',
    destinationUnknown: '-',
    cancelFailure: 'Error occurred during transfer cancellation.',
    rerunFailure: 'Error occurred during transfer rerun.',
    rerunStarting: 'Rerunning transfer...',
    rerunSuccess: 'Rerun transfer may be found in "Waiting" tab.',
    cellActions: {
      cancelTransfer: 'Cancel transfer',
      rerunTransfer: 'Rerun transfer',
    },
    cellFileName: {
      file: 'File:',
      dir: 'Directory',
      view: 'View',
      deleted: 'deleted',
    },
    cellStatus: {
      completed: 'Completed',
      skipped: 'Skipped',
      cancelled: 'Cancelled',
      failed: 'Failed',
      replicating: 'Replicating',
      scheduled: 'Scheduled',
      enqueued: 'Enqueued',
      aborting: 'Aborting',
      evicting: 'Evicting',
    },
    cellType: {
      replication: 'Replication',
      migration: 'Migration',
      eviction: 'Eviction',
    },
    cellTotalFiles: {
      evicted: 'evicted',
      replicated: 'replicated',
    },
  },
  queryParams: {
    label: 'Query parameters',
    empty: 'No query parameters provided for view transfer',
  },
  transferChart,
  throughputDistribution,
  transfersOverview,
  providerSelector,
};
