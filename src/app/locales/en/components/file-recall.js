import infoTable from './file-recall/info-table';
import cancelRecallModal from './file-recall/cancel-recall-modal';
import eventLog from './file-recall/event-log';

export default {
  header: 'Archive recall information',
  cancelRecall: 'Cancel recall',
  cancellingRecallBtn: 'Cancelling recall...',
  stateNotAvailableAlert: {
    intro: 'Some of the recall details are available only on the recalling Oneprovider. ',
    providerInfoHead: 'Switch to',
    providerInfoTail: 'to view complete statistics.',
  },
  tabs: {
    status: 'Status',
    logs: 'Error log',
  },
  infoTable,
  cancelRecallModal,
  eventLog,
};
