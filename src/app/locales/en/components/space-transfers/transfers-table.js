import headers from '../-browser-columns-name/transfer';

export default {
  headers,
  actions: '',
  destinationUnknown: '-',
  cancelFailure: 'Error occurred during transfer cancellation.',
  rerunFailure: 'Error occurred during transfer rerun.',
  cancellation: 'transfer cancellation',
  rerunning: 'transfer rerun',
  rerunStarting: 'Rerunning transfer...',
  rerunSuccess: 'Rerun transfer may be found in "Waiting" tab.',
  noTransfers: {
    file: 'There are no transfers for selected file or directory',
    waiting: 'There are no waiting transfers',
    ongoing: 'There are no ongoing transfers',
    ended: 'There are no ended transfers',
  },
};
