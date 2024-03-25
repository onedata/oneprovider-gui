import { expect } from 'chai';
import { describe, it } from 'mocha';
import EdmPropertyFactory, { setPropertyValue } from 'oneprovider-gui/utils/edm/property-factory';
import EdmObjectFactory from 'oneprovider-gui/utils/edm/object-factory';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmMetadataValidator from 'oneprovider-gui/utils/edm/metadata-validator';

describe('Unit | Utility | edm/metadata-validator', function () {
  it('is valid if all objects are valid', function () {
    const helper = new Helper();
    helper.initMetadata();
    for (const object of helper.metadata.edmObjects) {
      for (const property of object.edmProperties) {
        setPropertyValue(property, 'dummy');
      }
    }
    helper.initValidator();

    expect(helper.validator.isValid).to.be.true;
  });
});

class Helper {
  constructor() {
    this.metadataFactory = EdmMetadataFactory.create();
  }
  initMetadata() {
    this.metadata = this.metadataFactory.createInitialMetadata();
    this.objectFactory = new EdmObjectFactory(this.metadata);
    this.propertyFactory = EdmPropertyFactory.create();
    return this.metadata;
  }
  initValidator() {
    this.validator = EdmMetadataValidator.create({
      edmMetadata: this.metadata,
    });
    return this.validator;
  }
}
