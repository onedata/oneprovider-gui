export default {
  copy: 'copying',
  move: 'moving',
  noSizeInfo: 'Directory statistics are disabled for this space',
  initializingSizeInfo: 'Requested directory statistics are not ready yet – calculation is in progress.',
  initializingStatsInfo: 'Directory statistics are being initialized',
  enabledStatsInfo: 'Show more size statistics',
  disabledStatsInfo: 'Directory statistics are disabled. Click for more information.',
  qosStatusHint: {
    pending: 'Pending – data replication is still ongoing',
    fulfilled: 'Fulfilled – desired number of replicas have been created on matching storages and their contents are up-to-date',
    impossible: 'Impossible – there are not enough storages matching the expression to meet the required number of replicas',
    error: 'Cannot evaluate requirement status',
    noQos: 'There are no QoS requirements defined for this file',
  },
  replicationRateTooltip: 'Show data distribution details',
};
