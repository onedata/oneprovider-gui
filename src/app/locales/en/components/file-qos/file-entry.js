import _ from 'lodash';
import common from '../file-qos/-common';

const translations = {
  requirement: 'requirement',
  requirements: 'requirements',
  noRequirements: 'no requirements',
  statusHint: {
    fulfilled: 'All requirements for this {{fileType}} are fulfilled',
    pending: 'Pending – there are some unfulfilled requirements for this {{fileType}}',
    impossible: 'At least one requirement is impossible to be fulfilled',
    empty: 'No QoS requirements defined for this {{fileType}}',
    error: 'An error occurred when computing this {{fileType}}\'s QoS status – expand QoS requirements panel for details',
  },
  fileType: {
    file: 'file',
    dir: 'directory',
  },
};

export default _.merge({}, translations, common);
