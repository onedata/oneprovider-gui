import { expect } from 'chai';
import { describe, it } from 'mocha';
import { qosRpnToInfix } from 'oneprovider-gui/utils/qos-expression-converters';

describe('Unit | Utility | qos expression converters', function () {
  it('convert RPN to infix without parenthesis from left to right', function () {
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

  it('convert RPN to infix with parenthesis', function () {
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
