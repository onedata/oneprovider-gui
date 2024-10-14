import { expect } from 'chai';
import { describe, it, afterEach } from 'mocha';
import { get } from '@ember/object';
import qosRpnToQueryBlock from 'oneprovider-gui/utils/qos-rpn-to-query-block';

describe('Unit | Utility | qos-rpn-to-query-block', function () {
  afterEach(function () {
    this.rootBlock?.destroy();
  });

  it('generates root query block with "and" operator and condition blocks', function () {
    const rpnData = [
      'a',
      'b',
      '=',
      'c',
      '1',
      '>',
      '&',
    ];
    this.rootBlock = qosRpnToQueryBlock({ rpnData });

    expect(get(this.rootBlock, 'operator')).to.equal('root');
    expect(get(this.rootBlock, 'operands.length')).to.equal(1);
    const andBlock = get(this.rootBlock, 'operands.firstObject');
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

  it('interprets string with letters starting with number as a string', function () {
    const rpnData = [
      'a',
      '1a',
      '=',
    ];
    this.rootBlock = qosRpnToQueryBlock({ rpnData });
    const condition = get(this.rootBlock, 'operands.firstObject');

    expect(get(condition, 'comparator')).to.equal('string.eq');
  });

  it('uses storages array to get matching storage by id', function () {
    const storage = {
      entityId: 'abc1',
      name: 'hello',
    };
    const storages = [storage];
    const queryProperties = [{
      key: 'storageId',
      displayedKey: 'test storage',
      type: 'storage',
    }];
    const rpnData = [
      'storageId',
      'abc1',
      '=',
    ];
    this.rootBlock = qosRpnToQueryBlock({ rpnData, queryProperties, storages });
    const condition = get(this.rootBlock, 'operands.firstObject');

    expect(get(condition, 'comparator')).to.equal('storage.is');
    expect(get(condition, 'comparatorValue')).to.equal(storage);
  });

  it('uses providers array to get matching provider by id', function () {
    const provider = {
      entityId: 'pro1',
      name: 'hello',
    };
    const providers = [provider];
    const queryProperties = [{
      key: 'providerId',
      displayedKey: 'test provider',
      type: 'provider',
    }];
    const rpnData = [
      'providerId',
      'pro1',
      '=',
    ];
    this.rootBlock = qosRpnToQueryBlock({ rpnData, queryProperties, providers });
    const condition = get(this.rootBlock, 'operands.firstObject');

    expect(get(condition, 'comparator')).to.equal('provider.is');
    expect(get(condition, 'comparatorValue')).to.equal(provider);
  });
});
