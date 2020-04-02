import { replicasNumber, expression } from './-common';

export default {
  replicasNumber,
  expression,
  add: 'Add new QoS requirement',
  save: 'Save',
  direct: 'Direct',
  validation: {
    replicasNumberTooSmall: 'Replicas number should be integer greater than 0',
    expressionEmpty: 'Expression cannot be empty',
  },
};
