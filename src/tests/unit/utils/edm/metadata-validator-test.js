import { expect } from 'chai';
import { describe, it } from 'mocha';
import EdmPropertyFactory from 'oneprovider-gui/utils/edm/property-factory';
import EdmObjectFactory from 'oneprovider-gui/utils/edm/object-factory';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';
import EdmMetadataValidator from 'oneprovider-gui/utils/edm/metadata-validator';

describe('Unit | Utility | edm/metadata-validator', function () {
  it('is valid if all objects are valid', function () {
    const helper = new Helper();
    const o1 = helper.objectFactory.createObject(EdmObjectType.ProvidedCHO);
    const o2 = helper.objectFactory.createObject(EdmObjectType.Aggregation);
    helper.metadata.edmObjects = [o1, o2];
    helper.initValidator();

    expect(helper.validator.isValid).to.be.true;
  });
});

class Helper {
  constructor() {
    this.metadataFactory = EdmMetadataFactory.create();
    this.metadata = this.metadataFactory.createEmptyMetadata();
    this.objectFactory = new EdmObjectFactory(this.metadata);
    this.propertyFactory = EdmPropertyFactory.create();
  }
  initValidator() {
    this.validator = EdmMetadataValidator.create({
      edmMetadata: this.metadata,
    });
    return this.validator;
  }
}
