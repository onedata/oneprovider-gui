import fileQosSummary from './qos-modal/file-qos-summary';
import fileEntry from './qos-modal/file-entry';
import qosEntry from './qos-modal/qos-entry';
import qosEntryInfoSwitch from './qos-modal/qos-entry-info-switch';
import qosEntryCharts from './qos-modal/qos-entry-charts';
import qosEntryLogs from './qos-modal/qos-entry-logs';
import qosAdd from './qos-modal/qos-add';
import auditLog from './qos-modal/audit-log';

export default {
  headerShow: 'Quality of Service',
  headerAdd: 'Add Quality of Service requirement',
  headerAddMobile: 'Add QoS requirement',
  for: 'for',
  close: 'Close',
  fileType: {
    file: 'this file',
    dir: 'this directory',
    multi: 'selected items',
  },
  addHintTitle: 'Adding QoS requirement',
  addHint: 'QoS requirement is used to specify a desired number of replicas for the subject file/directory and an expression used to select matching storages where the replicas will be placed. The replicas will be automatically managed ‐ protected from eviction and reconciled upon changes to the file content.',
  showHintTitle: 'QoS requirements',
  showHintIntro: 'QoS is used to manage file replica distribution and redundancy between supporting Oneproviders. Users can define any number of QoS requirements for a file or directory. Each requirement consists of target replicas number and an expression that is used to select storages where the replicas should be placed ‐ it is matched against parameters that were assigned to storages by Oneprovider admins.',
  showHintTransfers: 'If required, data transfers are automatically triggered to satisfy the QoS requirements, and remote changes made to file content are automatically reconciled. File replicas corresponding to QoS requirements are protected from eviction.',
  showHintRemoving: 'Removing a QoS requirement does not automatically remove the replicas that were created during its lifetime, but they are no longer protected.',
  showHintDocLinkName: 'QoS',
  hintClose: 'OK',
  addingQosEntry: 'adding QoS requirement',
  fileQosStatusHint: {
    fulfilled: 'All requirements for {{fileType}} are fulfilled',
    pending: 'Pending ‐ there are some unfulfilled requirements for {{fileType}}',
    impossible: 'At least one requirement is impossible to be fulfilled',
    error: 'Error evaluating QoS status summary',
  },
  addMultiHint: 'A new QoS requirement will be added for all selected items ({{count}})',
  add: 'Add requirement',
  cancel: 'Cancel',
  save: 'Save',
  storage: 'storage',
  provider: 'provider',
  anyStorage: 'any storage',
  fileQosSummary,
  fileEntry,
  qosEntry,
  qosEntryInfoSwitch,
  qosEntryCharts,
  qosAdd,
  auditLog,
  qosEntryLogs,
};
