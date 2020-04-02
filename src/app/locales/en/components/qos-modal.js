import qosEntry from './qos-modal/qos-entry';
import qosAdd from './qos-modal/qos-add';

export default {
  header: 'Quality of Service',
  close: 'Close',
  fileType: {
    file: 'file',
    dir: 'directory',
  },
  status: {
    fulfilled: 'Fulfilled',
    pending: 'Pending',
  },
  addingQosEntry: 'adding QoS requirement',
  fileQosStatusHint: {
    fulfilled: 'All requirements for file are fulfilled',
    pending: 'Pending',
  },
  qosEntry,
  qosAdd,
};
