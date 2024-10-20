import { expect } from 'chai';
import { describe, it } from 'mocha';
import EdmPropertyValidator from 'oneprovider-gui/utils/edm/property-validator';
import EdmPropertyFactory from 'oneprovider-gui/utils/edm/property-factory';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';
import { setupRenderingTest } from 'ember-mocha';

describe('Integration | Utility | edm/property-validator', function () {
  setupRenderingTest();

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

  it('has isValid = false if property has an value containig only whitespaces', function () {
    // given
    const helper = new Helper();

    // when
    helper.initProperty('dc', 'description');
    helper.property.setSupportedValue('   ');
    helper.initValidator();

    // then
    expect(helper.validator.isValid).to.be.false;
  });

  it('has error if property supports both value types and has URI-value in literal', function () {
    // given
    const helper = new Helper();

    // when
    const property = helper.initProperty('dc', 'subject');
    property.value = 'http://example.com';
    helper.initValidator();

    // then
    expect(helper.validator.errors).to.be.not.empty;
  });

  it('does not have error if property supports only literals and has URI-value', function () {
    // given
    const helper = new Helper();

    // when
    const property = helper.initProperty('dc', 'title');
    property.value = 'http://example.com';
    helper.initValidator();

    // then
    expect(helper.validator.errors).to.be.empty;
  });

  it('has isValid = true if property has value from predefined values', function () {
    // given
    const helper = new Helper();

    // when
    helper.initProperty('edm', 'type');
    helper.property.setSupportedValue('3D');
    helper.initValidator();

    // then
    expect(helper.validator.isValid).to.be.true;
  });

  it('has isValid = false if property is from outside predefined values and does not allow to be custom',
    function () {
      // given
      const helper = new Helper();

      // when
      helper.initProperty('edm', 'type');
      helper.property.setSupportedValue('hello');
      helper.initValidator();

      // then
      expect(helper.validator.isValid).to.be.false;
    }
  );

  it('has isValid = false if property is from outside predefined values and does not match to the custom regexp',
    function () {
      // given
      const helper = new Helper();

      // when
      helper.initProperty('dcterms', 'medium');
      helper.property.setSupportedValue('http://vocab.getty.edu/aat/abc');
      helper.initValidator();

      // then
      expect(helper.validator.isValid).to.be.false;
    }
  );

  it('has isValid = true if property is from outside predefined values and allows to be custom',
    function () {
      // given
      const helper = new Helper();

      // when
      helper.initProperty('dcterms', 'medium');
      helper.property.setSupportedValue('http://vocab.getty.edu/aat/123456789');
      helper.initValidator();

      // then
      expect(helper.validator.isValid).to.be.true;
    }
  );
});

class Helper {
  constructor() {
    this.metadataFactory = EdmMetadataFactory;
    this.metadata = this.metadataFactory.createEmptyMetadata();
    this.propertyFactory =
      new EdmPropertyFactory(this.metadata, EdmObjectType.ProvidedCHO);
  }
  initProperty(namespace, name, options = {}) {
    this.property =
      this.propertyFactory.createProperty(namespace, name, options);
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
