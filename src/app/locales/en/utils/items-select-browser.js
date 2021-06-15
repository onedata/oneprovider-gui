const baseModel = {
  maxItemsConstraint: 'Only up to {{count}} items can be selected.',
};

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
    typeConstraint: 'Only {{typesText}} are allowed to be selected.',
  }),
};
