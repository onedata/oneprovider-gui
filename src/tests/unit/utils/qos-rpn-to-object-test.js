import { expect } from 'chai';
import { describe, context, it } from 'mocha';
import { qosRpnToInfix } from 'oneprovider-gui/utils/qos-expression-converters';

describe('Unit | Utility | qos expression converters', function () {
  context('convert RPN to infix', function () {
    it('without parenthesis from left to right', function () {
      const result = qosRpnToInfix([
        'a1',
        'b1',
        '=',
        'a2',
        'b2',
        '=',
        '|',
        'a3',
        'b3',
        '=',
        '&',
        'a4',
        'b4',
        '=',
        '\\',
        'a5',
        'b5',
        '=',
        '&',
      ]);
      expect(result).to.equal('a1=b1|a2=b2&a3=b3\\a4=b4&a5=b5');
    });

    it('with parenthesis', function () {
      const result = qosRpnToInfix([
        'a1',
        'b1',
        '=',
        'a2',
        'b2',
        '=',
        'a3',
        'b3',
        '=',
        '|',
        '&',
        'a4',
        'b4',
        '=',
        'a5',
        'b5',
        '=',
        '\\',
        '&',
      ]);
      expect(result).to.equal('a1=b1&(a2=b2|a3=b3)&(a4=b4\\a5=b5)');
    });

    it('with number comparison operators', function () {
      const result = qosRpnToInfix([
        'a1',
        'b1',
        '<',
        'a2',
        'b2',
        '>',
        '&',
        'a3',
        'b3',
        '<=',
        '&',
        'a4',
        'b4',
        '>=',
        '&',
      ]);
      expect(result).to.equal('a1<b1&a2>b2&a3<=b3&a4>=b4');
    });

    it('with anyStorage special symbol', function () {
      const result = qosRpnToInfix([
        'anyStorage',
        'a1',
        'a2',
        '=',
        '\\',
      ]);
      expect(result).to.equal('anyStorage\\a1=a2');
    });

    it('with spaced and dashed key and values', function () {
      const result = qosRpnToInfix([
        'a-1',
        'hello world',
        '=',
        'a 2',
        'foo-bar',
        '=',
        '&',
      ]);
      expect(result).to.equal('a-1=hello world&a 2=foo-bar');
    });
  });
});
