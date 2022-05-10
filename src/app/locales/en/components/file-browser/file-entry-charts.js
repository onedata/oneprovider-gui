export default {
  header: 'Directory size statistics',
  titles: {
    fileCount: {
      content: 'File count',
      tip: 'Total count of files in this directory and its subdirectories, divided into two categories; the number of directories and the number of all regular files, symbolic links and hard links.',
    },
    size: {
      content: 'Logical and physical byte size',
      tip: 'Logical byte size – the total size of the information contained in this directory and its subdirectories.<br>Physical byte size – the total storage size used by the physical data of files contained in this directory and its subdirectories, per storage. These statistics are collected independently by each Oneprovider supporting the space.',
    },
  },
  axes: {
    files: 'Count',
    bytes: 'Bytes',
  },
  seriesGroups: {
    totalCount: 'Total',
  },
  series: {
    directoriesCount: 'Directories',
    regAndLinksCount: 'Reg. files and links',
    totalSize: 'Logical size',
  },
};
