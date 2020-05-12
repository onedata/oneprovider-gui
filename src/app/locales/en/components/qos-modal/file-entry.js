import _ from 'lodash';
import common from './-common';

const translations = {
  requirement: 'requirement',
  requirements: 'requirements',
  noRequirements: 'no requirements',
  statusHint: {
    fulfilled: 'All requirements for {{fileType}} are fulfilled',
    pending: 'Pending',
    empty: 'No QoS requirements defined for this {{fileType}}',
    error: 'An error occured when computing {{fileType}}\'s QoS status ‐ expand QoS requirements panel for details',
  },
  fileType: {
    file: 'file',
    dir: 'directory',
  },
};

export default _.merge({}, translations, common);
