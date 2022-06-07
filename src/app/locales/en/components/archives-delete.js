import itemsInfo from './archives-delete/items-info';

export default {
  header: {
    headerText: {
      single: 'Delete archive',
      multi: 'Delete archives',
    },
  },
  body: {
    archive: {
      single: 'archive',
      multi: '{{count}} archives',
      theArchive: 'the archive',
      selected: 'selected archives',
      selectedCount: '{{count}} selected archives',
    },
    unknownDataset: '<em>unknown</em>',
    aboutToDelete: {
      detailed: 'You are about to delete following {{archivesText}} created from <strong>{{datasetName}}</strong> dataset:',
      simpleMulti: 'You are about to delete <strong>{{count}}</strong> archives created from <strong>{{datasetName}}</strong> dataset.',
    },
    irreversibleWarning: 'This operation is irreversible. All the data in {{archivesText}} will be lost.',
    nestedSharesInfo: 'In case any nested file or directory is shared, this operation will make the share detached.',
    toContinueRetype: 'To continue, retype following text into confirmation box:',
    confirmationPlaceholder: 'Type the confirmation text...',
    confirmation: {
      base: 'I understand that data of {{archivesText}} will be lost',
    },
    confirmationTextNotMatch: 'Type in valid confirmation text to unlock.',
  },
  footer: {
    cancel: 'Cancel',
    deleteSubmit: {
      single: 'Delete archive',
      multi: 'Delete {{count}} archives',
    },
  },
  deletingArchives: 'deleting some archive',
  itemsInfo,
};
