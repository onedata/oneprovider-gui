import { expect } from 'chai';
import { describe, it } from 'mocha';
import EdmPropertyFactory from 'oneprovider-gui/utils/edm/property-factory';
import EdmObjectFactory from 'oneprovider-gui/utils/edm/object-factory';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmMetadataValidator from 'oneprovider-gui/utils/edm/metadata-validator';
import { afterEach } from 'mocha';
import { settled } from '@ember/test-helpers';
import { makeAllPropertiesValid } from '../../../helpers/edm-utils';

describe('Unit | Utility | edm/metadata-validator', function () {
  afterEach(function () {
    this.helper?.destroy();
  });

  it('is valid if all objects are valid', function () {
    this.helper = new Helper();
    this.helper.initMetadata();
    for (const edmObject of this.helper.metadata.edmObjects) {
      makeAllPropertiesValid(edmObject);
    }
    this.helper.initValidator();

    expect(this.helper.validator.isValid).to.be.true;
  });

  it('destroys all property validators on destroy', async function () {
    // given
    this.helper = new Helper();
    this.helper.initMetadata();
    this.helper.initValidator();
    const propertyValidators = [];
    for (const objectValidator of this.helper.validator.objectValidators) {
      propertyValidators.push(...objectValidator.propertyValidators);
    }

    // when
    this.helper.validator.destroy();
    await settled();
    expect(this.helper.validator.isDestroyed).to.be.true;

    // then
    for (const propertyValidator of propertyValidators) {
      expect(propertyValidator.isDestroyed).to.be.true;
    }
  });
});

class Helper {
  constructor() {
    this.metadataFactory = EdmMetadataFactory;
  }
  initMetadata() {
    this.metadata = this.metadataFactory.createInitialMetadata();
    return this.metadata;
  }
  initValidator() {
    this.validator = EdmMetadataValidator.create({
      edmMetadata: this.metadata,
    });
    return this.validator;
  }
  destroy() {
    if (!this.validator?.isDestroyed && !this.validator?.isDestroying) {
      this.validator?.destroy();
    }
  }
}
