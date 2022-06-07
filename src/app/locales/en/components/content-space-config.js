export default {
  title: 'Settings',
  settingsDescription: 'Configuration regarding the support of <strong>{{space}}</strong> by provider <strong>{{provider}}</strong>.',
  toggleDescription: 'Directory size statistics',
  dirSizeStatsDescription: 'If enabled, directory size statistics will be collected for each directory in this space. They include metrics with file count, logical byte size and physical byte size and track their changes in time. The statistics can be viewed using the <em>Information</em> directory context action.',
  configuringDirSizeStats: 'configuring directory size statistics',
  recomputingWarning: 'Note that after enabling, statistics for the whole space will be recomputed, which may take a long time depending on its size.',
  additionalLoadWarning: 'Statistics collection causes an additional load on the provider and has a slight negative impact on file operation performance.',
};
