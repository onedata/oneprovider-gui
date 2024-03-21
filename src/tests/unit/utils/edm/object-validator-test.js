import { expect } from 'chai';
import { describe, it } from 'mocha';
import EdmPropertyValidator from 'oneprovider-gui/utils/edm/property-validator';
import EdmPropertyFactory from 'oneprovider-gui/utils/edm/property-factory';
import EdmObjectFactory from 'oneprovider-gui/utils/edm/object-factory';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';
import EdmObjectValidator from 'oneprovider-gui/utils/edm/object-validator';

describe('Unit | Utility | edm/object-validator', function () {
  it('is not valid if some of properties are not valid', function () {
    const helper = new Helper();
    helper.initObject(EdmObjectType.ProvidedCHO);
    const p1 = helper.propertyFactory
      .createProperty(helper.metadata, 'dc', 'description', { value: 'test' });
    const p2 = helper.propertyFactory
      .createProperty(helper.metadata, 'dc', 'description');
    helper.object.edmProperties = [p1, p2];
    helper.initValidator();

    expect(helper.validator.isValid).to.be.false;
  });

  it('is valid if all properties are valid', function () {
    const helper = new Helper();
    helper.initObject(EdmObjectType.ProvidedCHO);
    const p1 = helper.propertyFactory
      .createProperty(helper.metadata, 'dc', 'description', { value: 'test' });
    const p2 = helper.propertyFactory
      .createProperty(helper.metadata, 'dc', 'description', { value: 'example' });
    helper.object.edmProperties = [p1, p2];
    const pv1 = EdmPropertyValidator.create({ edmProperty: p1 });
    const pv2 = EdmPropertyValidator.create({ edmProperty: p2 });
    helper.initValidator([pv1, pv2]);

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
  initObject(edmObjectType) {
    this.object = this.objectFactory.createObject(edmObjectType);
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
