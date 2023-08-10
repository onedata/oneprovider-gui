import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  possibleFileProperties,
  propertyToAttributesMap,
  possibleFileRawAttributesSet,
} from 'oneprovider-gui/utils/file-model';
import _ from 'lodash';

describe('Unit | Utility | file-model', function () {
  it('has property to raw attributes mapping with all output raw attributes valid', function () {
    for (const property of possibleFileProperties) {
      let rawAttributes = propertyToAttributesMap[property];
      if (rawAttributes && !Array.isArray(rawAttributes)) {
        rawAttributes = [rawAttributes];
      }
      if (!_.isEmpty(rawAttributes)) {
        for (const attribute of rawAttributes) {
          expect(possibleFileRawAttributesSet.has(attribute), attribute).to.be.true;
        }
      }
    }
  });

  it('has property to raw attributes mapping with all keys properties valid', function () {
    for (const mapProperty of Object.keys(propertyToAttributesMap)) {
      expect(possibleFileProperties).to.include(mapProperty);
    }
  });
});
