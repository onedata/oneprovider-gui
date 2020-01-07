import transfersOverview from './space-transfers/transfers-overview';
import throughputDistribution from './space-transfers/throughput-distribution';
import transferChart from './space-transfers/transfer-chart';
import transfersTable from './space-transfers/transfers-table';
import transferDetails from './space-transfers/transfer-details';

export default {
  transferJobsHistory: 'Transfer jobs history',
  waitingTransfers: 'Waiting',
  ongoingTransfers: 'Ongoing',
  endedTransfers: 'Ended',
  onTheFlyTransfers: 'On-the-fly',
  initializingTransfers: 'Initializing transfers...',
  in: 'Input',
  out: 'Output',
  fileHistoryLimitReached: 'History limit per file reached',
  fileError: 'Error loading file data: {{reason}}',
  unknownFileName: 'File',
  fileTabHint: 'Shows transfers related to selected {{type}}',
  fileTabHintType: {
    file: 'file',
    dir: 'directory',
    unknown: 'data item',
  },
  cellActions: {
    cancelTransfer: 'Cancel transfer',
    rerunTransfer: 'Rerun transfer',
  },
  cellDataName: {
    file: 'File',
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
    unknown: 'Unknown',
  },
  cellTotalFiles: {
    evicted: 'evicted',
    replicated: 'replicated',
  },
  transferDetails,
  transfersTable,
  transferChart,
  throughputDistribution,
  transfersOverview,
};
