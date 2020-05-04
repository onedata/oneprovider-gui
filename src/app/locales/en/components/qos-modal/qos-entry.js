import _ from 'lodash';
import common from './-common';

const translations = {
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
    information: 'The replicas of this file corresponding to this QoS requirement will no longer be automatically managed.',
    cancel: 'No, keep it',
    remove: 'Yes, remove',
  },
};

export default _.merge({}, translations, common);
