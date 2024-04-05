import { expect } from 'chai';
import { describe, it } from 'mocha';
import EdmPropertyFactory from 'oneprovider-gui/utils/edm/property-factory';
import EdmObjectFactory from 'oneprovider-gui/utils/edm/object-factory';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';
import EdmObjectValidator from 'oneprovider-gui/utils/edm/object-validator';

describe('Unit | Utility | edm/object-validator', function () {
  it('is valid if object has all mandatory properties and all properties are valid', function () {
    const helper = new Helper();
    helper.initObject();
    helper.makeAllPropertiesValid();
    helper.initValidator();

    expect(helper.validator.isValid).to.be.true;
  });

  it('is not valid if object has all mandatory properties and some of properties are not valid', function () {
    const helper = new Helper();
    helper.initObject();
    helper.makeAllPropertiesValid();
    helper.object.edmProperties[0].setSupportedValue('');
    helper.initValidator();

    expect(helper.validator.isValid).to.be.false;
  });
});

class Helper {
  constructor() {
    this.metadataFactory = EdmMetadataFactory;
    this.metadata = this.metadataFactory.createEmptyMetadata();
    this.objectFactory = new EdmObjectFactory(this.metadata);
    this.propertyFactory = new EdmPropertyFactory(this.metadata);
  }
  initObject() {
    this.object = this.objectFactory.createInitialObject(EdmObjectType.ProvidedCHO);
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
  makeAllPropertiesValid() {
    for (const property of this.object.edmProperties) {
      if (property.hasPredefinedValues) {
        property.setSupportedValue(property.predefinedValues[0].value);
      } else {
        property.setSupportedValue('dummy');
      }
    }
  }
}
