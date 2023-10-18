const headerTooltipBeginning =
  '<p>Statistics for data transfers triggered by the QoS requirement from the point of view of the current Oneprovider (<strong>{{currentProviderName}}</strong>). The statistics are collected independently by each Oneprovider supporting the space and concern only <strong>incoming</strong> data transfers.</p>';

export default {
  header: 'Transfer statistics',
  headerTooltip: {
    singleProvider: headerTooltipBeginning,
    manyProviders: `${headerTooltipBeginning}<p>In order to view statistics for a different Oneprovider, switch to a different one in the top menu of the Data view.</p>`,
  },
  unknownStorage: 'Storage#{{id}}',
  unknownProvider: 'Provider#{{id}}',
  titles: {
    inbound: {
      content: 'Inbound',
      tip: 'Statistics concerning incoming data transfers for current Oneprovider (<strong>{{currentProviderName}}</strong>). Shows bytes written per each local storage backend that supports the space (i.e. per transfer target storage backend) and the total number of transferred files.',
    },
    outbound: {
      content: 'Outbound',
      tip: 'Statistics concerning incoming data transfers for current Oneprovider (<strong>{{currentProviderName}}</strong>). Shows bytes downloaded from remote Oneproviders, per each remote storage backend from which the data was fetched (i.e. per transfer source storage backend).',
    },
  },
  axes: {
    bytes: 'Bytes',
    files: 'Files',
  },
  series: {
    totalBytes: 'Total',
    totalFiles: 'Files',
  },
};
