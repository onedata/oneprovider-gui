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
    notFoundText: 'Archived file not found.',
    errorPrefix: 'Could not get archived file info',
  },
  sourceFile: {
    deletedText: 'File at the source location has been deleted.',
    infoTextPrefix: 'File at the source location exists, but note that it could have been modified or replaced since it was archived. You can',
    infoLink: 'navigate to its location',
    infoTextSuffix: 'anyway.',
    errorPrefix: 'Could not get source file info',
  },
  unknownError: 'unknown error',
};
