import transfersOverview from './space-transfers/transfers-overview';
import throughputDistribution from './space-transfers/throughput-distribution';

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
  transferChart: {
    minute: 'Minute',
    hour: 'Hour',
    day: 'Day',
    month: 'Month',
    time: 'Time',
    throughput: 'Throughput',
    output: 'Output',
    waitingForTransferStart: 'Waiting for the transfer to start...',
    noStatsForUnit: 'No activity in the last {{timeUnit}}.',
    waitingForStats: 'Gathering transfer statistics...',
    waitingForStatsTip: 'Statistics are delayed due to synchronization ' +
      'latency caused by data distribution.',
  },
  throughputDistribution,
  transfersOverview,
};
