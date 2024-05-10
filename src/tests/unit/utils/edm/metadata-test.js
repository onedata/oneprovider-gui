import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupTest } from 'ember-mocha';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmPropertyFactory from 'oneprovider-gui/utils/edm/property-factory';
import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';
import EdmObjectFactory from 'oneprovider-gui/utils/edm/object-factory';

describe('Unit | Utility | edm/metadata', function () {
  setupTest('util:edm/metadata', {});

  it('generates formatted XML with supported namespaces from empty EDM metadata model',
    function () {
      // given
      const factory = EdmMetadataFactory;
      const metadataModel = factory.createEmptyMetadata();

      // when
      const resultXml = metadataModel.stringify();

      // then
      const expectedXmlRe = new RegExp(`<\\?xml version="1.0" encoding="UTF-8"\\?>\\s*
<rdf:RDF\\s*
    xmlns:rdf="http://www\\.w3\\.org/1999/02/22-rdf-syntax-ns#"\\s*
    xmlns:dc="http://purl\\.org/dc/elements/1\\.1/"\\s*
    xmlns:dcterms="http://purl\\.org/dc/terms/"\\s*
    xmlns:edm="http://www.europeana\\.eu/schemas/edm/"\\s*
    xmlns:ore="http://www.openarchives\\.org/ore/terms/"/>`, 'm');
      expect(resultXml).to.match(expectedXmlRe);
    }
  );

  it('generates XML from EDM metadata model with some EDM objects and properties',
    function () {
      // given
      const factory = EdmMetadataFactory;
      const metadata = factory.createEmptyMetadata();
      const propertyFactory = new EdmPropertyFactory(metadata);
      const objectFactory = new EdmObjectFactory(metadata);
      const resourceId = 'urn://eriac/19';
      const providedCho = objectFactory.createObject(EdmObjectType.ProvidedCHO, {
        attrs: {
          about: resourceId,
        },
        edmProperties: [
          propertyFactory.createProperty('dc', 'contributor', {
            value: 'ERIAC',
            lang: 'en',
          }),
          propertyFactory.createProperty('dcterms', 'created', {
            value: '2018-03-13',
          }),
        ],
      });
      const aggregation = objectFactory.createObject(EdmObjectType.Aggregation, {
        attrs: {
          about: resourceId,
        },
        edmProperties: [
          propertyFactory.createProperty('edm', 'aggregatedCHO', {
            resource: '#example_direct_Image_1',
          }),
          propertyFactory.createProperty('edm', 'isShownBy', {
            resource: 'https://sammlung.mak.at/img/1200x1200/publikationsbilder/ki-18709-67-2_1.jpg',
          }),
        ],
      });
      const webResource = objectFactory.createObject(EdmObjectType.WebResource, {
        attrs: {
          about: 'https://sammlung.mak.at/img/1200x1200/publikationsbilder/ki-18709-67-2_1.jpg',
        },
        edmProperties: [
          propertyFactory.createProperty('dc', 'format', {
            value: 'jpg',
          }),
          propertyFactory.createProperty('dcterms', 'created', {
            value: '2017',
          }),
        ],
      });
      metadata.edmObjects = [providedCho, aggregation, webResource];

      // when
      const resultXml = metadata.stringify();

      // then
      const resultStrings = [
        '<edm:ProvidedCHO rdf:about="urn://eriac/19">',
        '<dc:contributor xml:lang="en">ERIAC</dc:contributor>',
        '<dcterms:created>2018-03-13</dcterms:created>',
        '<ore:Aggregation rdf:about="urn://eriac/19">',
        '<edm:isShownBy rdf:resource="https://sammlung.mak.at/img/1200x1200/publikationsbilder/ki-18709-67-2_1.jpg"/>',
        '<edm:WebResource rdf:about="https://sammlung.mak.at/img/1200x1200/publikationsbilder/ki-18709-67-2_1.jpg">',
        '<dc:format>jpg</dc:format>',
      ];

      for (const str of resultStrings) {
        expect(resultXml).to.contain(str);
      }
    }
  );

  it('includes unknown elements in XML generated from model from parsed XML',
    function () {
      // given
      const factory = EdmMetadataFactory;
      const xmlSource = `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:dcterms="http://purl.org/dc/terms/"
    xmlns:edm="http://www.europeana.eu/schemas/edm/"
    xmlns:ore="http://www.openarchives.org/ore/terms/"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    example extra content
    <!-- comment one -->
    <test>test content<!-- comment two --></test>
    other example
    <edm:ProvidedCHO rdf:about="#example_direct_Image_1">
        <!-- comment inside property -->
        <test>test content<!-- comment four --></test>
        another example
        <dcterms:created hello="world">1951</dcterms:created>
    </edm:ProvidedCHO>
</rdf:RDF>`;

      // when
      const metadataModel = factory.fromXml(xmlSource);
      const xmlOutput = metadataModel.stringify();

      // then
      const fragments = [
        '<edm:ProvidedCHO rdf:about="#example_direct_Image_1">',
        '<!-- comment one -->',
        '<test>test content',
        '<!-- comment two -->',
        '<dcterms:created hello="world">1951</dcterms:created>',
      ];
      for (const fragment of fragments) {
        expect(xmlOutput).to.contain(fragment);
      }
    }
  );
});
