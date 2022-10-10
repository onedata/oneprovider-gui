import logEntryDetails from './archive-audit-log/log-entry-details';

export default {
  customColumns: {
    file: 'File',
    event: 'Event',
    timeTaken: 'Time taken',
  },
  noLogs: {
    notOnCurrentProvider: 'No log entries available on current provider.',
    visitPrefix: 'Visit',
    visitSuffix: 'provider to see logs.',
  },
  cellTimeTaken: {
    startedAt: '{{fileTypeText}} archivisation started at',
  },
  logEntryDetails,
};
