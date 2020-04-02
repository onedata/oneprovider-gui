import Component from '@ember/component';
import { tag, and, eq, raw } from 'ember-awesome-macros';
import { getBy } from 'ember-awesome-macros';

export default Component.extend({
  tagName: '',

  data: undefined,

  parentOperator: undefined,

  operators: Object.freeze({
    or: '|',
    and: '&',
  }),

  operatorClass: tag `qos-group-${'data.operator'}`,

  operatorStringClass: tag `qos-group-operator-${'data.operator'}`,

  operatorString: getBy('operators', 'data.operator'),

  brackets: and(eq('data.operator', raw('or')), eq('parentOperator', raw('and'))),
});
