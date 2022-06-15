export default {
  noEntries: 'No log entries.',
  headerRow: {
    columnLabel: {
      timestamp: 'Time',
      file: 'File',
      event: 'Event',
    },
  },
  cellContentMessage: {
    unknown: 'unknown reason',
    // FIXME: maybe to remove reasons
    reasons: {
      alreadyReplicated: 'File already replicated.',
      deleted: 'File deleted.',
    },
  },
};
