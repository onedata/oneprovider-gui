import { replicasNumber, expression } from './-common';

export default {
  replicasNumber,
  expression,
  qosId: 'Requirement ID',
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
};
