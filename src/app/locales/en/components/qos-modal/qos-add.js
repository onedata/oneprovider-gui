import _ from 'lodash';
import common from './-common';

const translations = {
  validation: {
    replicasNumberTooSmall: 'Replicas number should be integer greater than 0',
    expressionEmpty: 'Expression cannot be empty',
  },
};

export default _.merge({}, translations, common);
