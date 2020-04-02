const replicasNumber = 'Replicas number';
const expression = 'Expression';

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
  qosEntry: {
    replicasNumber,
    expression,
    qosId: 'Requirement ID',
    new: 'New',
    direct: 'Direct',
    remove: 'Remove QoS requirement',
    inheritedFrom: 'inherited from',
    replica: 'replica',
    replicas: 'replicas',
    statusHint: {
      fulfilled: 'Fulfilled',
      pending: 'Pending',
    },
    removeQuestion: {
      header: 'Remove QoS requirement?',
      information: 'The replicas of this file corresponding to this QoS requirement will no longer be automatically managed, i.e. protected from eviction or reconciled upon changes to the file content (unless subject to another existing QoS requirement).',
      cancel: 'No, keep it',
      remove: 'Yes, remove',
    },
  },
  qosAdd: {
    replicasNumber,
    expression,
    add: 'Add new QoS requirement',
    save: 'Save',
    direct: 'Direct',
    validation: {
      replicasNumberTooSmall: 'Replicas number should be integer greater than 0',
      expressionEmpty: 'Expression cannot be empty',
    },
  },
};
