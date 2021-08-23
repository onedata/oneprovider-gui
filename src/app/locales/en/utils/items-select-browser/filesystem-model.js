import baseModel from './base-model';

export default Object.assign({}, baseModel, {
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
  submitCurrentLabel: 'Select current directory',
});
