import throughputDistribution from './throughput-distribution';

export default {
  providersMapOfDist: 'Ongoing transfers map',
  hide: 'Hide transfers overview',
  show: 'Show transfers overview',
  throughputTabsHint: {
    intro: 'Below chart shows the throughput of data transfers between Oneproviders. <strong>Inbound throughput</strong> is a summary of data transfers incoming to given Oneprovider. <strong>Outbound throughput</strong> is a summary of data transfers outgoing from given Oneprovider. Measurements can be viewed per Oneprovider, or on a combined chart.',
    total: 'Total',
    totalInfo: 'Sum of transfer jobs and on-the-fly throughput.',
    transferJobs: 'Transfer jobs',
    transferJobsInfo: 'Throughput of all data transfers that were manually triggered by users. Manual transfer jobs have lower priority than on-the-fly transfers.',
    onTheFly: 'On-the-fly',
    onTheFlyInfo: 'Throughput of all data transfers that were triggered by remote data access. On-the-fly transfers are performed in the background by Oneproviders when they are requested to serve file fragments that reside in a remote location. On-the-fly transfers do not show up on the transfer jobs list, only summarized statistics are available.',
  },
  throughputDistribution,
};
