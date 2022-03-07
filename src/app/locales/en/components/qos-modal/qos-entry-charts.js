const headerTooltipBeginning =
  'Statistics for data transfers triggered by the QoS requirement from the point of view of current Oneprovider (<strong>{{currentProviderName}}</strong>). The statistics are collected independently by each Oneprovider supporting the space and concern only <strong>incoming</strong> data transfers.';

export default {
  header: 'Transfer statistics',
  headerTooltip: {
    singleProvider: headerTooltipBeginning,
    manyProviders: `${headerTooltipBeginning} In order to view statistics for a different Oneprovider, switch to a different one in top menu of the Data view.`,
  },
  unknownStorage: 'Storage#{{id}}',
  unknownProvider: 'Provider#{{id}}',
  titles: {
    inbound: {
      content: 'Inbound',
      tip: 'Statistics concerning incoming data transfers for current Oneprovider (<strong>{{currentProviderName}}</strong>). Shows bytes written per each local storage that supports the space (i.e. per transfer target storage) and the total number of transferred files.',
    },
    outbound: {
      content: 'Outbound',
      tip: 'Statistics concerning incoming data transfers for current Oneprovider (<strong>{{currentProviderName}}</strong>). Shows bytes downloaded from remote Oneproviders, per each remote storage from which the data was fetched (i.e. per transfer source storage).',
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
