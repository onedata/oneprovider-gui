export default {
  header: 'Share {{fileType}}',
  close: 'Close',
  cancel: 'Cancel',
  setName: 'Enter name for created share that will be visible to other users',
  creatingShare: 'creating share',
  createNew: 'Create',
  createAnotherOne: 'Create another share',
  openShare: 'Open share',
  showIntro: 'The {{fileType}} <strong>{{fileName}}</strong> has already been shared {{shareCount}} {{times}}',
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
};
