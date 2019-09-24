const disabledActionSingleOneprovider = ' is available only with two or more supporting providers.';

export default {
  header: 'Data distribution',
  summary: 'Summary',
  details: 'Details',
  summarizedFilesDistribution: 'Summarized data distribution of selected files:',
  dirsDontHaveDistributionTip: 'Data distribution for directories is not available.',
  selectedItems: 'Selected items:',
  files: 'files',
  directories: 'directories',
  close: 'Close',
  chunksVisualizer: {
    na: 'n/a',
    neverSynchronized: 'Never synchronized',
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
    disabledReplicationInProgress: 'The data is currently replicated to selected Oneprovider.',
    disabledReplicationIsComplete: 'Cannot schedule replication as all file block are already on this Oneprovider.',
    disabledMigrationSingleOneprovider: 'Migration' + disabledActionSingleOneprovider,
    disabledMigrationInProgress: 'The data is currently migrated from selected Oneprovider.',
    disabledMigrationIsEmpty: 'Cannot schedule migration as there are no file blocks on this Oneprovider.',
    disabledEvictionSingleOneprovider: 'Eviction' + disabledActionSingleOneprovider,
    disabledEvictionInProgress: 'The data is currently evicted in selected Oneprovider.',
    disabledEvictionNoBlocks: 'Eviction is not possible unless some data blocks on this Oneprovider are redundant.',
  },
  destinationOneproviderSelector: {
    descriptionForManyFiles: 'Select destination for migrating selected files and directories:',
    descriptionForOneFile: 'Select destination for migrating {{fileName}}:',
    migrationArrowText: 'migrate to',
    cancelButton: 'Cancel',
    migrateButton: 'Migrate',
  },
};
