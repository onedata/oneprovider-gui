import providerRow from './size-stats-per-provider-table/provider-row';
import errorCell from './size-stats-per-provider-table/error-cell';
const synchronizationDelay =
  'Values may temporarily differ between providers due to synchronization delays after recent changes.';

export default {
  containsTip: 'The values may be different for each provider due to delays in synchronization of recent data modifications.',
  logicalSizeTip: 'Logical size is the total size of file data contained in this directory, i.e. the sum of logical byte sizes of all regular files. <br> ' +
    synchronizationDelay,
  physicalSizeTip: 'Physical size is the actual amount of storage consumed on a given storage backend by all regular files in the directory\'s subtree.May be smaller than the virtual size if some file replicas are incomplete. <br> ' +
    synchronizationDelay,
  virtualSizeTip: 'Virtual size is the logical size with hardlinks counted only once, i.e. the size of unique file data in the subtree. Represents the storage space required for a complete replica of the directory. <br> ' +
    synchronizationDelay,
  fileCounters: providerRow.fileCounters,
  providerRow,
  errorCell,
};
