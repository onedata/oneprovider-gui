import itemsInfo from './archives-purge/items-info';

export default {
  header: {
    headerText: {
      single: 'Purge archive',
      multi: 'Purge archives',
    },
  },
  body: {
    archive: {
      single: 'archive',
      multi: '{{count}} archives',
    },
    unknownDataset: '<em>unknown</em>',
    aboutToPurge: 'You are about to purge following {{archivesText}} created from <strong>{{datasetName}}</strong> dataset:',
    irreversibleWarning: 'This operation is irreversible. All the data in the archive will be lost.',
    nestedSharesInfo: 'In case any nested file or directory is shared, this operation will make the share detached.',
    toContinueRetype: 'To continue, retype following text into confirmation box:',
    confirmationPlaceholder: 'Type the confirmation text...',
    confirmation: {
      archive: {
        single: 'the archive',
        multi: '{{count}} selected archives',
      },
      base: 'I understand that data of {{archiveText}} will be lost',
    },
    confirmationTextNotMatch: 'Type in valid confirmation text to unlock.',
  },
  footer: {
    cancel: 'Cancel',
    purgeSubmit: {
      single: 'Purge archive',
      multi: 'Purge {{count}} archives',
    },
  },
  purgingArchives: 'purging some archive',
  itemsInfo,
};
