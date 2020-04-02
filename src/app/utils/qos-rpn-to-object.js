import _ from 'lodash';

const pairRe = /(.+?)=(.+)/;
const operatorRe = /(\||&)/;

function isPair(item) {
  return pairRe.test(item);
}

function isOperator(item) {
  return operatorRe.test(item);
}

function isNegation(item) {
  return item === operatorChar['not'];
}

export const operatorName = {
  '|': 'or',
  '&': 'and',
  '-': 'not',
};

export const operatorChar = {
  or: '|',
  and: '&',
  not: '-',
};

export default function qosRpnToObject(rpnData) {
  const source = _.cloneDeep(rpnData);
  const stack = [];
  while (source.length) {
    const item = source.shift();
    if (isPair(item)) {
      const [, key, value] = item.match(pairRe);
      stack.push({
        type: 'pair',
        key,
        value,
      });
    } else if (isOperator(item)) {
      // RPN algorithm: first value from stack is second element of expression
      const b = stack.pop();
      const a = stack.pop();
      if (a && b) {
        stack.push({
          type: 'group',
          operator: operatorName[item],
          a,
          b,
        });
      } else {
        throw new Error('not enough symbols for operator');
      }
    } else if (isNegation(item)) {
      const a = stack.pop();
      stack.push({
        type: 'not',
        a,
      });
    } else {
      throw new Error(`unrecognized expression element: ${item}`);
    }
  }
  if (!stack.length || stack.length > 1) {
    throw new Error('bad expression: not enought operators');
  } else {
    return stack[0];
  }
}

function expand(obj, parentOperator) {
  if (obj.type === 'group') {
    const brackets = (obj.operator === 'or' && parentOperator === 'and');
    return `${brackets ? '(' : ''}${expand(obj.a, obj.operator)}${operatorChar[obj.operator]}${expand(obj.b, obj.operator)}${brackets ? ')' : ''}`;
  } else if (obj.type === 'pair') {
    return `${obj.key}=${obj.value}`;
  } else {
    throw new Error(`unrecognized qos object type: ${obj.type}`);
  }
}

export function qosRpnToInfix(rpnData) {
  return expand(qosRpnToObject(rpnData));
}
