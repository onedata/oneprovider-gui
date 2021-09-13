export default {
  header: 'Share {{fileType}}',
  close: 'Close',
  cancel: 'Cancel',
  setName: 'Enter name for created share that will be visible to other users',
  creatingShare: 'creating share',
  createNew: 'Create',
  createAnotherOne: 'Create another share',
  openShare: 'Open share',
  showIntroCount: 'This {{fileType}} has already been shared {{shareCount}} {{times}}',
  validations: {
    nameTooShort: 'Name must have at least {{length}} characters',
    nameTooLong: 'Name cannot be longer than {{length}} characters',
    regexp: 'Name contains invalid characters',
  },
  times: {
    singular: 'time',
    plural: 'times',
  },
  fileType: {
    file: 'file',
    dir: 'directory',
  },
  regexpHint: 'Name must be composed only of UTF-8 letters, digits, parentheses and underscores. Dashes, spaces and dots are allowed (but not at the beginning or the end).',
  warning: {
    file: 'This file will not be accessible via any public share because it has no <em>read</em> POSIX permission for <em>other</em>.',
    dir: 'This directory will not be accessible via any public share because it has no <em>read</em> and <em>execute</em> POSIX permissions for <em>other</em>.',
  },
};
