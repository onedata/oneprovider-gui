import transfersOverview from './space-transfers/transfers-overview';
import throughputDistribution from './space-transfers/throughput-distribution';
import providerSelector from './space-transfers/provider-selector';
import transferChart from './space-transfers/transfer-chart';
import liveStatsTable from './space-transfers/live-stats-table';

export default {
  scheduledTransfers: 'Waiting',
  activeTransfers: 'Ongoing',
  completedTransfers: 'Ended',
  onTheFlyTransfers: 'On-the-fly',
  initializingTransfers: 'Initializing transfers...',
  in: 'Input',
  out: 'Output',
  fileHistoryLimitReached: 'History limit per file reached',
  fileNotExists: 'Selected file or directory does not exist',
  queryParams: {
    label: 'Query parameters',
    empty: 'No query parameters provided for view transfer',
  },
  liveStatsTable,
  transferChart,
  throughputDistribution,
  transfersOverview,
  providerSelector,
};
