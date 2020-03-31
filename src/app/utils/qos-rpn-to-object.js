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
  return item === '\\';
}

const cls = {
  '|': 'or',
  '&': 'and',
};

export default function qosRpnToObject(rpnData) {
  const source = _.cloneDeep(rpnData);
  const stack = [];
  while (source.length) {
    const item = source.shift();
    console.log(`using: ${item}`);
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
          operator: cls[item],
          a,
          b,
        });
      } else {
        throw new Error('not enough symbols for operator');
      }
    } else if (isNegation(item)) {
      // FIXME: support for negation
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
