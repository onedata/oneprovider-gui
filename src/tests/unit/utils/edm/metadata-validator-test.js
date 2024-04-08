import { expect } from 'chai';
import { describe, it } from 'mocha';
import EdmPropertyFactory from 'oneprovider-gui/utils/edm/property-factory';
import EdmObjectFactory from 'oneprovider-gui/utils/edm/object-factory';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmMetadataValidator from 'oneprovider-gui/utils/edm/metadata-validator';
import { afterEach } from 'mocha';
import { settled } from '@ember/test-helpers';

describe('Unit | Utility | edm/metadata-validator', function () {
  afterEach(function () {
    this.helper?.destroy();
  });

  it('is valid if all objects are valid', function () {
    const helper = new Helper();
    helper.initMetadata();
    for (const object of helper.metadata.edmObjects) {
      for (const property of object.edmProperties) {
        if (property.hasPredefinedValues) {
          property.setSupportedValue(property.predefinedValues[0].value);
        } else {
          property.setSupportedValue('dummy');
        }
      }
    }
    helper.initValidator();

    expect(helper.validator.isValid).to.be.true;
  });

  it('destroys all property validators on destroy', async function () {
    // given
    const helper = new Helper();
    helper.initMetadata();
    helper.initValidator();
    const propertyValidators = [];
    for (const objectValidator of helper.validator.objectValidators) {
      propertyValidators.push(...objectValidator.propertyValidators);
    }

    // when
    helper.validator.destroy();
    await settled();
    expect(helper.validator.isDestroyed).to.be.true;

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
    this.objectFactory = new EdmObjectFactory(this.metadata);
    this.propertyFactory = new EdmPropertyFactory(this.metadata);
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
