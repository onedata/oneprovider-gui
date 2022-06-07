export default {
  header: 'Directory size statistics',
  headerTooltip: 'Below charts present changes in time of the directory size statistics, calculated for all items in this directory and all its subdirectories. The file count and logical byte size statistics are synchronized among all Oneproviders, while the physical byte size statistics are collected and viewable independently (use the switch in the top menu of the Data view to display physical size statistics for corresponding Oneprovider).',
  unknownStorage: 'Storage#{{id}}',
  unknownProvider: 'Unknown provider',
  noStatistics: 'Requested directory statistics are not ready yet – calculation is in progress.',
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
};
