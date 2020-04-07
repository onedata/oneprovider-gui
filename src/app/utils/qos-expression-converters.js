import _ from 'lodash';

const pairRe = /(.+?)=(.+)/;
const operatorRe = /(\||&|-)/;

function isPair(item) {
  return pairRe.test(item);
}

function isOperator(item) {
  return operatorRe.test(item);
}

function expandInfix(obj) {
  if (obj.type === 'group') {
    const parentheses = obj.parentheses;
    return `${parentheses ? '(' : ''}${expandInfix(obj.a)}${operatorChar[obj.operator]}${expandInfix(obj.b)}${parentheses ? ')' : ''}`;
  } else if (obj.type === 'pair') {
    return `${obj.key}=${obj.value}`;
  } else {
    throw new Error(`unrecognized qos object type: ${obj.type}`);
  }
}

export const operatorChar = {
  union: '|',
  intersect: '&',
  complement: '-',
};

export const operatorName = _.invert(operatorChar);

export function qosRpnToObject(rpnData) {
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
          parentheses: Boolean(stack.length),
          a,
          b,
        });
      } else {
        throw new Error('not enough symbols for operator');
      }
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

export function qosRpnToInfix(rpnData) {
  return expandInfix(qosRpnToObject(rpnData));
}
