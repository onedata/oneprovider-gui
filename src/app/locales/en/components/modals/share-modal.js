import { noHandleServicesText } from '../share-show/pane-opendata';

export default {
  header: 'Share / Publish {{fileType}}',
  cancel: 'Cancel',
  intro: 'Anyone on the internet with the link will be able to read the data.',
  shareNameIntro: 'Share name (visible to the share audience):',
  creatingShare: 'creating share',
  createNew: 'Create',
  publishText: 'Publish as an Open Data record',
  publishTip: 'Choose this option to create a share and directly proceed to publish it as an Open Data record. The shared data collection will be registered in a handle service — assigned a persistent identifier (e.g. PID or DOI) and exposed for discovery by Open Data indexes via OAI PMH protocol. This process will make your data collection publicly available (without an account in Onedata) and anyone will be able to look it up in the Open Data indexes.',
  publishImpossibleTip: noHandleServicesText,
  validations: {
    nameTooShort: 'Name must have at least {{length}} characters',
    nameTooLong: 'Name cannot be longer than {{length}} characters',
    regexp: 'Name contains invalid characters',
  },
  fileType: {
    file: 'file',
    dir: 'directory',
  },
  regexpHint: 'Name must be composed only of UTF-8 letters, digits, parentheses and underscores. Dashes, spaces and dots are allowed (but not at the beginning or the end).',
};
