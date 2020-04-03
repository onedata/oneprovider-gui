import { expect } from 'chai';
import { describe, it } from 'mocha';
import { qosRpnToInfix } from 'oneprovider-gui/utils/qos-rpn-to-object';

describe('Unit | Utility | qos rpn to object', function () {
  // Replace this with your real tests.
  it('converts RPN to infix without parenthesis from left to right', function () {
    const result = qosRpnToInfix([
      'a1=b1',
      'a2=b2',
      '|',
      'a3=b3',
      '&',
      'a4=b4',
      '-',
      'a5=b5',
      '&',
    ]);
    expect(result).to.equal('a1=b1|a2=b2&a3=b3-a4=b4&a5=b5');
  });

  it('converts RPN to infix with parenthesis', function () {
    const result = qosRpnToInfix([
      'a1=b1',
      'a2=b2',
      'a3=b3',
      '|',
      '&',
      'a4=b4',
      'a5=b5',
      '-',
      '&',
    ]);
    expect(result).to.equal('a1=b1&(a2=b2|a3=b3)&(a4=b4-a5=b5)');
  });
});
