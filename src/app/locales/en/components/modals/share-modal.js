import { noHandleServicesText } from '../share-show/pane-opendata';

export default {
  header: 'Share / Publish {{fileType}}',
  cancel: 'Cancel',
  setName: 'Enter name for created share that will be visible to other users',
  creatingShare: 'creating share',
  createNew: 'Create',
  publishText: 'I want to publish this shared dataset as Open Data',
  publishTip: '<p>You can register this shared dataset in a handle service – it will be assigned a persistent identifier (e.g. PID or DOI) and exposed for discovery by Open Data indexes via OAI PMH protocol. This process will make your dataset globally available (without an account in Onedata) and anyone will be able to search for it in the Open Data indexes.</p><p>By selecting this option, you will be directed to the Open Data wizard.</p>',
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
