import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import EdmPropertyFactory from 'oneprovider-gui/utils/edm/property-factory';
import EdmObjectFactory from 'oneprovider-gui/utils/edm/object-factory';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';
import EdmObjectValidator from 'oneprovider-gui/utils/edm/object-validator';
import {
  EdmPropertyMaxOccurrences,
  EdmPropertyRecommendation,
  getAllSpecs,
} from 'oneprovider-gui/utils/edm/property-spec';
import { makeAllPropertiesValid } from '../../../helpers/edm-utils';

describe('Integration | Utility | edm/object-validator', function () {
  const { beforeEach } = setupRenderingTest();

  beforeEach(function () {
    this.allSpecs = getAllSpecs();
  });

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

  it('is not valid if object does not have all mandatory properties', function () {
    // prerequirement: description is mandatory
    expect(this.allSpecs.dc.description[EdmObjectType.ProvidedCHO].rec)
      .to.equal(EdmPropertyRecommendation.Mandatory);

    const helper = new Helper();
    helper.initObject();
    const descriptionProperty = helper.object.edmProperties.find(property =>
      property.edmPropertyType === 'description'
    );
    helper.object.deleteProperty(descriptionProperty);
    helper.makeAllPropertiesValid();
    helper.initValidator();

    expect(helper.validator.isValid).to.be.false;
  });

  it('is not valid if object have some properties exceeding occurrence limit', function () {
    // prerequirement: type has max single occurrence
    expect(this.allSpecs.dc.type[EdmObjectType.ProvidedCHO].max)
      .to.equal(EdmPropertyMaxOccurrences.Single);

    const helper = new Helper();
    helper.initObject();
    const extraDescription = helper.propertyFactory.createProperty('dc', 'type');
    helper.object.addProperty(extraDescription);
    helper.makeAllPropertiesValid();
    helper.initValidator();

    expect(helper.validator.isValid).to.be.false;
  });

  it('is valid if object have multiple properties that can be multiple', function () {
    // prerequirement: created has no occurrence limit
    expect(this.allSpecs.dcterms.created[EdmObjectType.ProvidedCHO].max)
      .to.equal(EdmPropertyMaxOccurrences.Any);

    const helper = new Helper();
    helper.initObject();
    const extraCreated1 = helper.propertyFactory.createProperty('dc', 'created');
    const extraCreated2 = helper.propertyFactory.createProperty('dc', 'created');
    helper.object.addProperty(extraCreated1);
    helper.object.addProperty(extraCreated2);
    helper.makeAllPropertiesValid();
    helper.initValidator();

    expect(helper.validator.isValid).to.be.true;
  });
});

class Helper {
  constructor() {
    this.metadataFactory = EdmMetadataFactory;
    this.metadata = this.metadataFactory.createEmptyMetadata();
    this.objectFactory = new EdmObjectFactory(this.metadata);
    this.propertyFactory = new EdmPropertyFactory(
      this.metadata,
      EdmObjectType.ProvidedCHO
    );
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
    return makeAllPropertiesValid(this.object);
  }
}
