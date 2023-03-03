/**
 * Functions and regexp for parsing/visualizing QoS expression
 *
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import _ from 'lodash';

const operatorRe = /^(\||&|\\)$/;
const pairOperatorRe = /^(=|>|<|<=|>=)$/;

function isVariable(item) {
  return item === 'anyStorage';
}

function isPairElement(item) {
  return (typeof item === 'string' || typeof item === 'number');
}

function isOperator(item) {
  return operatorRe.test(item);
}

function isPairOperator(item) {
  return pairOperatorRe.test(item);
}

function expandInfix(obj) {
  if (obj.type === 'group') {
    const parentheses = obj.parentheses;
    return `${parentheses ? '(' : ''}${expandInfix(obj.a)}${operatorChar[obj.operator]}${expandInfix(obj.b)}${parentheses ? ')' : ''}`;
  } else if (obj.type === 'pair') {
    return `${obj.key}${pairOperatorChar[obj.operator]}${obj.value}`;
  } else if (obj.type === 'variable') {
    return obj.name;
  } else {
    throw new Error(`unrecognized qos object type: ${obj.type}`);
  }
}

export const operatorChar = {
  union: '|',
  intersect: '&',
  complement: '\\',
};

export const operatorName = _.invert(operatorChar);

export const pairOperatorChar = {
  is: '=',
  eq: '=',
  lt: '<',
  gt: '>',
  lte: '<=',
  gte: '>=',
};

export const pairOperatorName = _.invert(pairOperatorChar);

export function qosRpnToObject(rpnData) {
  const source = _.cloneDeep(rpnData);
  const stack = [];
  while (source.length) {
    const item = source.shift();
    if (isVariable(item)) {
      stack.push({
        type: 'variable',
        name: item,
      });
    } else if (isPairOperator(item)) {
      const b = stack.pop();
      const a = stack.pop();
      if (typeof a === 'string' && (typeof b === 'string' || typeof b === 'number')) {
        stack.push({
          type: 'pair',
          operator: pairOperatorName[item],
          key: a,
          value: b,
        });
      } else {
        throw new Error('not enough symbols or invalid key/value for pair operator');
      }
    } else if (isOperator(item)) {
      // RPN algorithm: first value from stack is second element of expression
      const b = stack.pop();
      const a = stack.pop();
      if (a && b) {
        stack.push({
          type: 'group',
          operator: operatorName[item],
          parentheses: Boolean(stack.length),
          a,
          b,
        });
      } else {
        throw new Error('bad expression: not enough symbols for operator');
      }
    } else if (isPairElement(item)) {
      stack.push(item);
    } else {
      throw new Error(`unrecognized expression element: ${item}`);
    }
  }
  if (!stack.length || stack.length > 1) {
    throw new Error('bad expression: not enough operators');
  } else {
    return stack[0];
  }
}

export function qosRpnToInfix(rpnData) {
  return expandInfix(qosRpnToObject(rpnData));
}
