import { expect } from 'chai';
import { describe, it } from 'mocha';
import EdmPropertyFactory, { setPropertyValue } from 'oneprovider-gui/utils/edm/property-factory';
import EdmObjectFactory from 'oneprovider-gui/utils/edm/object-factory';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';
import EdmObjectValidator from 'oneprovider-gui/utils/edm/object-validator';

describe('Unit | Utility | edm/object-validator', function () {
  it('is valid if object has all mandatory properties and all properties are valid', function () {
    const helper = new Helper();
    helper.initObject(EdmObjectType.ProvidedCHO);
    for (const property of helper.object.edmProperties) {
      setPropertyValue(property, 'dummy');
    }
    helper.initValidator();

    expect(helper.validator.isValid).to.be.true;
  });

  it('is not valid if object has all mandatory properties and some of properties are not valid', function () {
    const helper = new Helper();
    helper.initObject(EdmObjectType.ProvidedCHO);
    for (const property of helper.object.edmProperties) {
      setPropertyValue(property, 'dummy');
    }
    setPropertyValue(helper.object.edmProperties[0], '');
    helper.initValidator();

    expect(helper.validator.isValid).to.be.false;
  });
});

class Helper {
  constructor() {
    this.metadataFactory = EdmMetadataFactory.create();
    this.metadata = this.metadataFactory.createEmptyMetadata();
    this.objectFactory = new EdmObjectFactory(this.metadata);
    this.propertyFactory = EdmPropertyFactory.create();
  }
  initObject(edmObjectType) {
    this.object = this.objectFactory.createInitialObject(edmObjectType);
    this.metadata.edmObjects = [this.object];
    return this.object;
  }
  initValidator() {
    if (!this.object) {
      throw new Error('initObject first');
    }
    this.validator = EdmObjectValidator.create({
      edmObject: this.object,
    });
    return this.validator;
  }
}
