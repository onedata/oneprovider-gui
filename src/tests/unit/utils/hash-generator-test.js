import { expect } from 'chai';
import { describe, it } from 'mocha';
import HashGenerator from 'oneprovider-gui/utils/hash-generator';
import sinon from 'sinon';

describe('Unit | Utility | hash generator', function () {
  it('generates CRC-16 (KERMIT algorithm) hexadecimal hash from provided string', function () {
    const subject = new HashGenerator();

    const result = subject.getHash('hello world');

    expect(result).to.equal('a1d2');
  });

  it('generates the same hashes for the same values', function () {
    const subject = new HashGenerator();

    const result1 = subject.getHash('hello world');
    const result2 = subject.getHash('hello world');

    expect(result1).to.equal('a1d2');
    expect(result2).to.equal(result1);
  });

  it('returns different hashes if hashes generated by algorithm are are the same for different values',
    function () {
      const subject = new HashGenerator();

      // these two strings should generate the same hash using CRC-16 KERMIT
      // you can check it with: https://crccalc.com/
      const hash1 = subject.getHash('this is a test of crc');
      const hash2 = subject.getHash('uhis!is a tdst og crc');

      expect(hash1).to.equal('2bf6');
      expect(hash2).to.not.equal(hash1);
      expect(hash2).to.be.not.empty;
    }
  );

  it('does not invoke generating method if value has been already used', function () {
    const subject = new HashGenerator();
    const generateSpy = sinon.spy(subject, 'generate');

    subject.getHash('hello world');
    subject.getHash('hello world');

    expect(generateSpy).to.have.been.calledOnce;
  });

  it('has generation limit if hashes collide', function () {
    const subject = new HashGenerator();
    subject.collisionsLimit = 5;
    subject.cache = {
      a: '0001',
      b: '0002',
      c: '0003',
      d: '0004',
      e: '0005',
      f: '0006',
    };
    const value = 'initial';
    const generate = sinon.stub(subject, 'generate');
    // NOTE: not a black-box test - uses generate generate recursive logic
    generate
      .withArgs(value).returns('0001')
      .withArgs('0001' + value).returns('0002')
      .withArgs('0002' + value).returns('0003')
      .withArgs('0003' + value).returns('0004')
      .withArgs('0004' + value).returns('0005')
      .withArgs('0005' + value).returns('0006')
      .withArgs('0006' + value).throws('too many generate invocations')
      .throws('generate invocation with unexpected value');

    const result = subject.getHash(value);

    expect(result).to.equal('0005');
  });

  it('pads result to 4 hex chars string', function () {
    const subject = new HashGenerator();

    // KERMIT algorithm generates 0x05A5 for this value
    const result = subject.generate('/root2/one');

    // without padding with "0" this could be "5a5"
    expect(result).to.equal('05a5');
  });
});
