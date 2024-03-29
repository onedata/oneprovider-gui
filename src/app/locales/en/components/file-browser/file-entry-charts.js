import sizeStatsPerProviderTable from './size-stats-per-provider-table';

export default {
  noStatisticsTitle: 'Directory statistics not ready yet',
  noStatisticsContent: 'The requested directory statistics are still being calculated, please come back in a while.',
  currentSize: {
    header: 'Current size',
    fileCounters: {
      ...sizeStatsPerProviderTable.fileCounters,
      totalPhysicalSizeLabel: 'Total physical size',
    },
    currentSizeOnProvidersCount: 'collected from <span>{{providersWithStatsCount}} out of {{providersCount}}</span> providers',
    currentSizeTip: 'Presented information is partial since it was collected only from online providers with enabled directory size statistics. From the global point of view, the actual size of the space may differ.',
    logicalSizeTip: 'Logical byte size is the total size of file data contained in this directory, i.e. the sum of logical byte sizes of all regular files.',
    totalPhysicalSizeTip: 'Summarized storage size used to store the data. Includes only the sizes reported by online providers with enabled directory size statistics.',
  },
  showMoreStats: 'Show size statistics per provider',
  hideMoreStats: 'Hide size statistics per provider',
  historicalSize: {
    header: 'Historical size statistics',
    headerTooltip: 'Below charts present changes in time of the directory size statistics, calculated for all items in this directory and all its subdirectories. The file count and logical byte size statistics are synchronized among all Oneproviders, while the physical byte size statistics are collected and viewable independently (use the switch in the top menu of the Data view to display physical size statistics for corresponding Oneprovider).',
    unknownStorage: 'Storage#{{id}}',
    titles: {
      fileCount: {
        content: 'File count',
        tip: 'Total count of files in this directory and its subdirectories, divided into two categories; the number of directories and the number of all regular files, symbolic links or hard links.',
      },
      size: {
        content: 'Logical and physical byte size',
        tip: 'Logical byte size is the total size of file data contained in this directory, i.e. the sum of logical byte sizes of all regular files. Physical byte size is the total storage size used to store the regular file data, per storage, collected independently by each supporting Oneprovider. To view physical size statistics for a different Oneprovider, switch to it in the top menu of the Data view.',
      },
    },
    axes: {
      files: 'Count',
      bytes: 'Bytes',
    },
    seriesGroups: {
      totalCount: 'Total',
      totalPhysicalSize: 'Physical size',
    },
    series: {
      directoriesCount: 'Directories',
      regAndLinksCount: 'Reg. files and links',
      totalLogicalSize: 'Logical size',
    },
  },
};
