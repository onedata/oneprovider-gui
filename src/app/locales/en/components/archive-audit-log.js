import logEntryDetails from './archive-audit-log/log-entry-details';

export default {
  customColumns: {
    file: 'File',
    event: 'Event',
    timeTaken: 'Time taken',
  },
  cellTimeTaken: {
    startedAt: '{{fileTypeText}} archivisation started at',
  },
  logEntryDetails,
};
