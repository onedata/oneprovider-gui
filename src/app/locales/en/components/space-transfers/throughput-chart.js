export default {
  throughputTabsHint: {
    intro: 'This chart shows data transfer throughput between Oneproviders. Inbound throughput represents data transferred to the selected Oneprovider, while outbound throughput represents data transferred from it. Statistics can be viewed per Oneprovider or as a combined overview.',
    total: 'Total',
    totalInfo: 'Combined throughput of all three transfer types.',
    transferJobs: 'Transfer jobs',
    transferJobsInfo: 'Throughput of data transfers explicitly initiated by users. These transfers share the same priority as QoS transfers and are the only ones listed in the transfers list below.',
    qos: 'Quality of Service',
    qosInfo: 'Throughput of transfers triggered automatically by QoS replica reconciliation, for example when creating new replicas or updating local copies after changes in remote data. These transfers share the same priority as transfer jobs.',
    onTheFly: 'On-the-fly',
    onTheFlyInfo: 'Throughput of transfers triggered automatically during remote data access, when a Oneprovider fetches file fragments from another provider to serve a request. These transfers have the highest priority.',
  },
  all: 'Total',
  jobs: 'Transfer jobs',
  onTheFly: 'On-the-fly',
  qos: 'Quality of Service',
  qosShort: 'QoS',
  close: 'Close',
};
