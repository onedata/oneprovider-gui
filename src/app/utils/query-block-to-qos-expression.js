/**
 * Generate QoS expression string from query block object.
 * 
 * Maps standard query builder operators to RUCIO operators
 * (https://rucio.readthedocs.io/en/latest/rse_expressions.html#operators)
 * - or -> union
 * - and -> intersect
 * - except -> complement
 * 
 * @module utils/query-block-to-qos-expression
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { get, getProperties } from '@ember/object';
import { isEmpty } from '@ember/utils';

const qosOperators = {
  or: '|',
  and: '&',
  except: '\\',
};

const qosComparators = {
  'provider.is': '=',
  'storage.is': '=',
  'string.eq': '=',
  'number.eq': '=',
  'number.lt': '<',
  'number.lte': '<=',
  'number.gt': '>',
  'number.gte': '>=',
  'stringOptions.eq': '=',
  'numberOptions.eq': '=',
  'numberOptions.lt': '<',
  'numberOptions.lte': '<=',
  'numberOptions.gt': '>',
  'numberOptions.gte': '>=',
  'mixedOptions.eq': '=',
  'mixedOptions.lt': '<',
  'mixedOptions.lte': '<=',
  'mixedOptions.gt': '>',
  'mixedOptions.gte': '>=',
};

export default function queryBlockToQosExpression(queryBlock, level = -1) {
  if (!queryBlock) {
    return '';
  }
  const operands = get(queryBlock, 'operands');
  if (get(queryBlock, 'isOperator')) {
    if (get(queryBlock, 'operator') === 'root') {
      return queryBlockToQosExpression(operands[0], 0);
    } else {
      const operator = get(queryBlock, 'operator');
      const rawOperator = qosOperators[operator];
      if (!rawOperator) {
        throw new Error(
          `util:query-block-to-qos-expression: invalid operator: ${operator}`
        );
      }
      if (isEmpty(operands)) {
        return '';
      } else {
        const subexpression = operands.map(operand =>
          queryBlockToQosExpression(operand, level + 1)
        ).filter(expression => Boolean(expression)).join(rawOperator);
        return level === 0 ? subexpression : (subexpression ? `(${subexpression})` : '');
      }
    }
  } else if (get(queryBlock, 'isCondition')) {
    const {
      property,
      comparator,
      comparatorValue,
    } = getProperties(queryBlock, 'property', 'comparator', 'comparatorValue');
    const key = get(property, 'key');
    if (get(property, 'type') === 'symbol') {
      return key;
    } else {
      const rawComparator = qosComparators[comparator];
      if (!rawComparator) {
        throw new Error(
          `util:query-block-to-qos-expression: invalid comparator: ${comparator}`
        );
      }
      const value = comparatorValue && get(comparatorValue, 'entityId') ||
        comparatorValue;
      return `${key}${rawComparator}${value}`;
    }
  }
}
