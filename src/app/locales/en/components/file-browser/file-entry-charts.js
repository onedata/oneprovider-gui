export default {
  header: 'Directory size statistics',
  headerTooltip: 'Show statistics for directory',
  titles: {
    fileCount: {
      content: 'File count',
      tip: 'Total count of files in this directory and its subdirectories, divided into two categories; the number of directories and the number of all regular files, symbolic links and hard links.',
    },
    size: {
      content: 'Logical and physical byte size',
      tip: 'Logical byte size - the total size of the information contained in this directory and its subdirectories, i.e. the sum of logical byte sizes of all contained regular files.<br>Physical byte size - the total storage size used by the physical data of files contained in this directory and its subdirectories, per storage. These statistics are collected independently by each Oneprovider supporting the space. In order to view statistics for a different Oneprovider, switch to a different one in the top menu of the Data view.<br>Please note that the physical file data may be distributed among different storages in different Oneproviders and some its parts may have several replicas. This means that the sum of all physical byte sizes is usually greater than the logical byte size.',
    },
  },
  axes: {
    files: 'Count',
    bytes: 'Bytes',
  },
  series: {
    directoriesCount: 'Directories',
    filesCount: 'Reg. files and links',
    totalSize: 'Logical size',
  },
};
