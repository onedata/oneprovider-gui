import _ from 'lodash';

const pairRe = /(.+?)=(.+)/;
const operatorRe = /(\||&|-)/;

function isPair(item) {
  return pairRe.test(item);
}

function isOperator(item) {
  return operatorRe.test(item);
}

// FIXME: use union, intersect, complement as in RSE (rucio)
export const operatorName = {
  '|': 'or',
  '&': 'and',
  '-': 'diff',
};

export const operatorChar = {
  or: '|',
  and: '&',
  diff: '-',
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
      // FIXME: rename brackets to parenthesis
      if (a && b) {
        stack.push({
          type: 'group',
          operator: operatorName[item],
          brackets: Boolean(stack.length),
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

function expand(obj) {
  if (obj.type === 'group') {
    const brackets = obj.brackets;
    return `${brackets ? '(' : ''}${expand(obj.a)}${operatorChar[obj.operator]}${expand(obj.b)}${brackets ? ')' : ''}`;
  } else if (obj.type === 'pair') {
    return `${obj.key}=${obj.value}`;
  } else {
    throw new Error(`unrecognized qos object type: ${obj.type}`);
  }
}

// FIXME: move to other file
export function qosRpnToInfix(rpnData) {
  return expand(qosRpnToObject(rpnData));
}
