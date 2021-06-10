export default {
  select: 'Select {{itemType}}',
  itemType: {
    single: {
      file: 'a file',
      directory: 'a directory',
      fileOrDirectory: 'a file or directory',
      dataset: 'a dataset',
      archive: 'an archive',
      item: 'an item',
    },
    multi: {
      file: 'files',
      directory: 'directories',
      fileOrDirectory: 'files or directories',
      dataset: 'datasets',
      archive: 'archives',
      item: 'items',
    },
  },
  constraintMax: '(max. {{count}} items)',
};
