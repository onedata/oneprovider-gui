import { noHandleServicesText } from '../share-show/pane-publicdata';

export default {
  header: 'Share / Publish {{fileType}}',
  cancel: 'Cancel',
  intro: 'Anyone on the internet with the link will be able to read the data.',
  shareNameIntro: 'Share name (visible to the share audience):',
  creatingShare: 'creating share',
  createNew: 'Create',
  publishText: 'Expose as a Public Data record',
  publishTip: 'Choose this option to create a share and sebsequently expose it as a Public Data record. The shared data collection will be registered in a handle service — assigned a persistent identifier (e.g. PID or DOI) and exposed for discovery by Public Data indexes via OAI PMH protocol. This process will make your data collection publicly available (without an account in Onedata) and anyone will be able to look it up in the Public Data indexes.',
  publishImpossibleTip: noHandleServicesText,
  validations: {
    empty: 'Name cannot be empty',
    nameTooLong: 'Name cannot be longer than {{length}} characters',
    regexp: 'Name contains invalid characters or is forbidden',
  },
  fileType: {
    file: 'file',
    dir: 'directory',
  },
  regexpHint: 'Name cannot contain slashes (/) and null characters. It cannot be also a single dot (".") or two dots ("..").',
};
