const disabledActionSingleOneprovider =
  ' is available only with two or more supporting providers.';

export default {
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
  copyHint: 'Copy storage file path to clipboard',
};
