import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupTest } from 'ember-mocha';
import EdmPropertyFactory from 'oneprovider-gui/utils/edm/property-factory';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';

describe('Unit | Utility | edm/property-factory', function () {
  setupTest('util:edm/property-factory', {});

  it('property with defined default language has this language set', function () {
    // given
    const metadata = EdmMetadataFactory.createEmptyMetadata();
    const factory = new EdmPropertyFactory(metadata);

    // when
    const property = factory.createProperty('dc', 'title');

    // then
    expect(property.lang).to.equal('en');
  });

  it('property with language support, but without default language, has empty language', function () {
    // given
    const metadata = EdmMetadataFactory.createEmptyMetadata();
    const factory = new EdmPropertyFactory(metadata);

    // when
    const property = factory.createProperty('dc', 'contributor');

    // then
    expect(property.lang).to.equal(null);
  });
});
