import { expect } from 'chai';
import { describe, it } from 'mocha';
import EdmPropertyValidator from 'oneprovider-gui/utils/edm/property-validator';
import EdmPropertyFactory from 'oneprovider-gui/utils/edm/property-factory';
import EdmObjectFactory from 'oneprovider-gui/utils/edm/object-factory';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';

describe('Unit | Utility | edm/property-validator', function () {
  it('has isValid = true if property has a non-empty value', function () {
    // given
    const helper = new Helper();

    // when
    helper.initProperty('dc', 'description');
    helper.initValidator();

    // when
    helper.property.value = 'hello';

    // then
    expect(helper.validator.isValid).to.be.true;
  });

  it('has isValid = false if property has an empty value', function () {
    // given
    const helper = new Helper();

    // when
    helper.initProperty('dc', 'description');
    helper.initValidator();

    // then
    expect(helper.validator.isValid).to.be.false;
  });

  it('has isValid = true if property has a value set after being empty, reading isValid and using updateValue',
    function () {
      // given
      const helper = new Helper();

      // when
      helper.initProperty('dc', 'description');
      helper.initValidator();
      // first read to compute the isValid property
      helper.validator.isValid;
      helper.property.value = 'hello';
      helper.validator.updateValue();

      // then
      expect(helper.validator.isValid).to.be.true;
    }
  );
});

class Helper {
  constructor() {
    this.metadataFactory = EdmMetadataFactory.create();
    this.metadata = this.metadataFactory.createEmptyMetadata();
    this.objectFactory = new EdmObjectFactory(this.metadata);
    this.propertyFactory = EdmPropertyFactory.create();
    this.object = this.objectFactory.createObject(EdmObjectType.ProvidedCHO);
    this.metadata.edmObjects = [this.object];
  }
  initProperty(namespace, name, options = {}) {
    this.property =
      this.propertyFactory.createProperty(this.metadata, namespace, name, options);
    return this.property;
  }
  initValidator() {
    if (!this.property) {
      throw new Error('initProperty first');
    }
    this.validator = EdmPropertyValidator.create({
      edmProperty: this.property,
    });
    return this.validator;
  }
}
