import { expect } from 'chai';
import { describe, it } from 'mocha';
import EmberObject, { get } from '@ember/object';
import { hasProtectionFlag } from 'oneprovider-gui/utils/dataset-tools';
import { A } from '@ember/array';

describe('Unit | Utility | dataset tools', function () {
  describe('include hasProtectionFlag computed property util which', function () {
    testHasProtectionFlag('data', false);
    testHasProtectionFlag('data', true);
    testHasProtectionFlag('metadata', false);
    testHasProtectionFlag('metadata', true);

    it('detects changes of a protection flag', function () {
      const testObject = EmberObject.extend({
        myFlags: A(['data_protection']),
        isProtected: hasProtectionFlag('myFlags', 'data'),
      }).create();

      expect(get(testObject, 'isProtected')).to.equal(true);
      get(testObject, 'myFlags').removeObject('data_protection');
      expect(get(testObject, 'isProtected')).to.equal(false);
    });
  });
});

function testHasProtectionFlag(flagType, isSet) {
  const flags = isSet ? [`${flagType}_protection`] : [];
  const presenceText = isSet ? 'presence' : 'lack';
  it(`detects ${presenceText} of ${flagType}_protection flag`, function () {
    const testObject = EmberObject.extend({
      myFlags: Object.freeze(flags),
      isProtected: hasProtectionFlag('myFlags', flagType),
    }).create();

    expect(get(testObject, 'isProtected')).to.equal(isSet);
  });
}
