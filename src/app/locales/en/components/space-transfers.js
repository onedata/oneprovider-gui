import transfersOverview from './space-transfers/transfers-overview';
import throughputDistribution from './space-transfers/throughput-distribution';
import transferChart from './space-transfers/transfer-chart';
import transfersTable from './space-transfers/transfers-table';
import transferDetails from './space-transfers/transfer-details';
import fileTransfersTableContainer from './space-transfers/file-transfers-table-container';

export default {
  transferJobsHistory: 'Transfer jobs history',
  waitingTransfers: 'Waiting',
  ongoingTransfers: 'Ongoing',
  endedTransfers: 'Ended',
  onTheFlyTransfers: 'On-the-fly',
  initializingTransfers: 'Initializing transfers...',
  in: 'Input',
  out: 'Output',
  fileError: 'Error loading file data: {{reason}}',
  unknownFileName: 'File',
  fileTabHint: 'Shows transfers related to selected {{type}}',
  notSupportedByProvider: 'This space is not supported by current Oneprovider',
  fileTabHintType: {
    file: 'file',
    dir: 'directory',
    unknown: 'data item',
  },
  dataNameTooltip: {
    dataset: 'Dataset',
    archive: 'Archive',
    file: 'File',
    dir: 'Directory',
    view: 'View',
    deleted: 'deleted',
    unknown: 'unknown',
  },
  cellActions: {
    cancelTransfer: 'Cancel transfer',
    rerunTransfer: 'Rerun transfer',
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
  cellAffectedFiles: {
    evicted: 'evicted',
    replicated: 'replicated',
  },
  transferDetails,
  transfersTable,
  transferChart,
  throughputDistribution,
  transfersOverview,
  fileTransfersTableContainer,
};
