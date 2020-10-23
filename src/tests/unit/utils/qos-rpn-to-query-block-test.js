import { expect } from 'chai';
import { describe, it } from 'mocha';
import { get } from '@ember/object';
import qosRpnToQueryBlock from 'oneprovider-gui/utils/qos-rpn-to-query-block';

describe('Unit | Utility | qos rpn to query block', function () {
  it('generates root query block with "and" operator and condition blocks', function () {
    const rpn = [
      'a',
      'b',
      '=',
      'c',
      '1',
      '>',
      '&',
    ];
    const rootBlock = qosRpnToQueryBlock(rpn);

    expect(get(rootBlock, 'operator')).to.equal('root');
    expect(get(rootBlock, 'operands.length')).to.equal(1);
    const andBlock = get(rootBlock, 'operands.firstObject');
    expect(get(andBlock, 'operator')).to.equal('and');
    expect(get(andBlock, 'operands.length')).to.equal(2);
    const operand0 = get(andBlock, 'operands')[0];
    const operand1 = get(andBlock, 'operands')[1];
    expect(get(operand0, 'isCondition')).to.be.true;
    expect(get(operand1, 'isCondition')).to.be.true;
    expect(get(operand0, 'property.key')).to.equal('a');
    expect(get(operand0, 'comparator')).to.equal('string.eq');
    expect(get(operand0, 'comparatorValue')).to.equal('b');
    expect(get(operand1, 'property.key')).to.equal('c');
    expect(get(operand1, 'comparator')).to.equal('number.gt');
    expect(get(operand1, 'comparatorValue')).to.equal('1');
  });
});
