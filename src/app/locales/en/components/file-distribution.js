const disabledActionSingleOneprovider =
  ' is available only with two or more supporting providers.';

// FIXME: into separate files
export default {
  body: {
    // FIXME: remove if unused
  },
  chunksVisualizer: {
    neverSynchronized: 'Never synchronized',
    neverSynchronizedTip: 'This file was never read or modified on selected Oneprovider. File blocks will be synchronized when needed. You can also manually replicate the file to selected Oneprovider.',
    block: 'block',
    blocks: 'blocks',
    blocksSize: '{{size}} in {{blockCount}} {{blockNoun}}',
  },
  header: {
    tabName: {
      summary: 'Summary',
      details: 'Details',
    },
    onlySingleOneproviderSupport: 'Current space is supported by only one Oneprovider, thus advanced data replication or migration features are not available.',
    dataDistributionPerStorage: 'Data distribution per storage',
  },
  progressBarVisualizer: {
    na: 'n/a',
    naTip: 'Directory statistics are disabled',
  },
  oneprovidersDistribution: {
    file: 'file',
    dir: 'directory',
    currentlyTransferredText: 'This {{elementType}} is currently transferred between Oneproviders',
    currentlyTransferredLink: 'see ongoing transfers',
    time: 'time',
    times: 'times',
    endedTransfersText: 'This {{elementType}} was transferred manually {{count}} {{countUnit}}',
    orMore: 'or more',
    endedTransfersLink: 'see history',
    noTransfersText: 'This {{elementType}} has never been transferred manually.',
    cannotLoadTransfers: 'Cannot load transfers',
    blockDistributionLegend: 'Block distribution',
    replicationRatioLegend: 'Replication ratio',
  },
  oneprovidersDistributionItem: {
    replicationInProgress: 'The data is being replicated to this Oneprovider.',
    noReplicationInProgress: 'There is no data replication to this Oneprovider at the moment.',
    migrationInProgress: 'The data is being migrated from this Oneprovider.',
    noMigrationInProgress: 'There is no data migration from this Oneprovider at the moment.',
    evictionInProgress: 'The data is being evicted in this Oneprovider.',
    noEvictionInProgress: 'There is no data eviction from this Oneprovider at the moment.',
    replicateHere: 'Replicate here',
    migrate: 'Migrate...',
    evict: 'Evict',
    replicationStart: 'Replicate the data to selected Oneprovider.',
    migrationStart: 'Migrate the data to other Oneprovider...',
    evictionStart: 'Evict redundant data blocks on this Oneprovider.',
    disabledReplicationSingleOneprovider: 'Replication' + disabledActionSingleOneprovider,
    disabledReplicationIsComplete: 'Cannot schedule replication as all file block are already on this Oneprovider.',
    disabledReplicationReadonly: 'Cannot schedule replication as all supporting storages of this Oneprovider are readonly.',
    disabledMigrationSingleOneprovider: 'Migration' + disabledActionSingleOneprovider,
    disabledMigrationIsEmpty: 'Cannot schedule migration as there are no file blocks on this Oneprovider.',
    disabledEvictionSingleOneprovider: 'Eviction' + disabledActionSingleOneprovider,
    disabledEvictionNoBlocks: 'Eviction is not possible unless some data blocks on this Oneprovider are redundant.',
  },
  destinationOneproviderSelector: {
    descriptionForManyFiles: 'Select destination for migrating selected files:',
    descriptionForOneFile: 'Select destination for migrating {{fileName}}:',
    selectTargetDropdownPlaceholder: 'Select target...',
    migrationArrowText: 'migrate to',
    readonly: 'readonly support',
    evicting: 'evicting',
    cancelButton: 'Cancel',
    migrateButton: 'Migrate',
  },
  confirmSubsequentTransfer: {
    transferTypes: {
      replication: 'replication',
      migration: 'migration',
      eviction: 'eviction',
    },
    messageText: 'There are pending transfers of selected files in {{oneproviderName}}. Starting a new {{transferType}} can interrupt existing transfers. Do you want to start a new {{transferType}} anyway?',
    startReplicationButton: 'Start replication',
    startMigrationButton: 'Start migration',
    startEvictionButton: 'Start eviction',
    cancelButton: 'Cancel',
  },
};
