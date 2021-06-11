const baseModel = {};

export default {
  baseModel,
  datasetModel: Object.assign({}, baseModel, {
    dataset: {
      single: 'a dataset',
      multi: 'datasets',
    },
  }),
  filesystemModel: Object.assign({}, baseModel, {
    fileType: {
      single: {
        file: 'a file',
        dir: 'a directory',
        symlink: 'a symlink',
      },
      multi: {
        file: 'files',
        dir: 'directories',
        symlink: 'symlinks',
      },
    },
  }),
};
