import _ from 'lodash';
import common from './-common';

const translations = {
  validation: {
    replicasNumberTooSmall: 'Replicas number should be integer greater than 0',
    expressionEmpty: 'Expression cannot be empty',
  },
  insertCondition: 'Insert condition...',
  fetchingSuggestions: 'fetching QoS parameters suggestions',
  validatingQosExpression: 'validating QoS expression',
  copyExpression: 'Copy expression',
  enterText: 'enter as text',
  enterQosExpression: 'Enter QoS expression...',
  storage: 'storage',
  provider: 'provider',
  anyStorage: 'any storage',
  convertingRpnToBlock: 'creating visual QoS expression representation',
};

export default _.merge({}, translations, common);
