import _ from 'lodash';
import common from './-common';

const translations = {
  qosId: 'Requirement ID',
  direct: 'Direct',
  remove: 'Remove QoS requirement',
  inheritedFrom: 'Inherited from',
  replica: 'replica',
  replicas: 'replicas',
  disabledRemoveHint: '<strong>Inherited requirement</strong> – cannot be removed directly.<br>You can remove it from the directory indicated as the inheritance source.',
  statusHint: {
    pending: 'Pending ‐ data replication is still ongoing',
    fulfilled: 'Fulfilled – desired number of replicas have been created on matching storages and their contents are up-to-date',
    impossible: 'Impossible – there are not enough storages matching the expression to meet the required number of replicas',
    error: 'Cannot evaluate requirement status',
  },
  removeQuestion: {
    header: 'Remove QoS requirement?',
    information: 'The replicas of this file corresponding to this QoS requirement will no longer be automatically managed.',
    cancel: 'No, keep it',
    remove: 'Yes, remove',
  },
};

export default _.merge({}, translations, common);
