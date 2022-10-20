export default {
  archivisationEventHeader: '{{fileTypeText}} archivisation event',
  labels: {
    event: 'Event',
    relativeLocation: 'Relative location',
    startTime: 'Started at',
    endTime: 'Finished at',
    sourceItem: 'Source item',
    archivedItem: 'Archived item',
    timeTaken: 'Time taken',
    absoluteLocation: 'Absolute location',
    fileId: 'File ID',
  },
  archivedFile: {
    errorPrefix: 'Could not retrieve details about the archived item.',
  },
  sourceFile: {
    deletedText: 'The source item no longer exists in the dataset.',
    infoTextPrefix: 'The source location indicates from where the item was copied at the moment of its archivisation. Since then, it may have been modified or replaced. You can still',
    infoLink: 'view this location in file browser',
    errorPrefix: 'Could not retrieve details about the source item',
  },
  unknownError: 'unknown error',
  filesInformationNotAvailable: 'Detailed information about the archived item and the source item is not available.',
};
