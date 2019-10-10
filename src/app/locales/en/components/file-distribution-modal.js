const disabledActionSingleOneprovider = ' is available only with two or more supporting providers.';

export default {
  header: 'Data distribution',
  summary: 'Summary',
  details: 'Details',
  selectedItems: 'Selected items:',
  files: 'files',
  file: 'file',
  directories: 'directories',
  directory: 'directory',
  close: 'Close',
  onlySingleOneproviderSupport: 'Current space is supported by only one Oneprovider, thus advanced data replication or migration features are not available.',
  chunksVisualizer: {
    na: 'n/a',
    neverSynchronized: 'Never synchronized',
    neverSynchronizedTip: 'This file was never read or modified on selected Oneprovider. File blocks will be synchronized when needed. You can also manually replicate the file to selected Oneprovider.',
  },
  oneprovidersDistribution: {
    summarizedFilesDistribution: 'Summarized data distribution of selected files:',
    dirsDontHaveDistributionTip: 'Data distribution for directories is not available.',
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
  },
  oneprovidersDistributionItem: {
    replicationInProgress: 'The data is currently replicated to selected Oneprovider.',
    migrationInProgress: 'The data is currently migrated from selected Oneprovider.',
    evictionInProgress: 'The data is currently evicted in selected Oneprovider.',
    replicateHere: 'Replicate here',
    migrate: 'Migrate...',
    evict: 'Evict',
    replicationStart: 'Replicate the data to selected Oneprovider.',
    migrationStart: 'Migrate the data to other Oneprovider...',
    evictionStart: 'Evict redundant data blocks on this Oneprovider',
    disabledReplicationSingleOneprovider: 'Replication' + disabledActionSingleOneprovider,
    disabledReplicationIsComplete: 'Cannot schedule replication as all file block are already on this Oneprovider.',
    disabledMigrationSingleOneprovider: 'Migration' + disabledActionSingleOneprovider,
    disabledMigrationIsEmpty: 'Cannot schedule migration as there are no file blocks on this Oneprovider.',
    disabledEvictionSingleOneprovider: 'Eviction' + disabledActionSingleOneprovider,
    disabledEvictionNoBlocks: 'Eviction is not possible unless some data blocks on this Oneprovider are redundant.',
  },
  destinationOneproviderSelector: {
    descriptionForManyFiles: 'Select destination for migrating selected files and directories:',
    descriptionForOneFile: 'Select destination for migrating {{fileName}}:',
    selectTargetDropdownPlaceholder: 'Select target...',
    migrationArrowText: 'migrate to',
    busy: 'busy',
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
