import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupTest } from 'ember-mocha';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';
import EdmMetadata from 'oneprovider-gui/utils/edm/metadata';

describe('Unit | Utility | edm/metadata', function () {
  setupTest('util:edm/metadata', {});

  it('generates XML with supported namespaces from empty EDM metadata model',
    function () {
      // given
      const factory = EdmMetadataFactory.create();
      const metadataModel = factory.createEmptyMetadata();

      // when
      const resultXml = metadataModel.stringify();

      // then
      expect(resultXml).to.equal(
        '<?xml version="1.0" encoding="UTF-8"?><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:edm="http://www.europeana.eu/schemas/edm/" xmlns:ore="http://www.openarchives.org/ore/terms/"/>'
      );
    }
  );

  it('generates XML from EDM metadata model with some EDM objects and properties',
    function () {
      // given
      const factory = EdmMetadataFactory.create();
      const metadataModel = factory.createEmptyMetadata();
      const resourceId = 'urn://eriac/19';
      const providedCho = factory.createObject(metadataModel, EdmObjectType.ProvidedCHO, {
        attrs: {
          about: resourceId,
        },
        edmProperties: [
          factory.createProperty(metadataModel, 'dc', 'contributor', {
            value: 'ERIAC',
            lang: 'en',
          }),
          factory.createProperty(metadataModel, 'dcterms', 'created', {
            value: '2018-03-13',
          }),
        ],
      });
      const aggregation = factory.createObject(metadataModel, EdmObjectType.Aggregation, {
        attrs: {
          about: resourceId,
        },
        edmProperties: [
          factory.createProperty(metadataModel, 'edm', 'aggregatedCHO', {
            resource: '#example_direct_Image_1',
          }),
          factory.createProperty(metadataModel, 'edm', 'isShownBy', {
            resource: 'https://sammlung.mak.at/img/1200x1200/publikationsbilder/ki-18709-67-2_1.jpg',
          }),
        ],
      });
      const webResource = factory.createObject(metadataModel, EdmObjectType.WebResource, {
        attrs: {
          about: 'https://sammlung.mak.at/img/1200x1200/publikationsbilder/ki-18709-67-2_1.jpg',
        },
        edmProperties: [
          factory.createProperty(metadataModel, 'dc', 'format', {
            value: 'jpg',
          }),
          factory.createProperty(metadataModel, 'dcterms', 'created', {
            value: '2017',
          }),
        ],
      });
      metadataModel.edmObjects = [providedCho, aggregation, webResource];

      // when
      const resultXml = metadataModel.stringify();

      // then
      expect(resultXml).to.equal(
        '<?xml version="1.0" encoding="UTF-8"?><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:edm="http://www.europeana.eu/schemas/edm/" xmlns:ore="http://www.openarchives.org/ore/terms/"><edm:ProvidedCHO rdf:about="urn://eriac/19"><dc:contributor xml:lang="en">ERIAC</dc:contributor><dcterms:created>2018-03-13</dcterms:created></edm:ProvidedCHO><ore:Aggregation rdf:about="urn://eriac/19"><edm:aggregatedCHO rdf:resource="#example_direct_Image_1"/><edm:isShownBy rdf:resource="https://sammlung.mak.at/img/1200x1200/publikationsbilder/ki-18709-67-2_1.jpg"/></ore:Aggregation><edm:WebResource rdf:about="https://sammlung.mak.at/img/1200x1200/publikationsbilder/ki-18709-67-2_1.jpg"><dc:format>jpg</dc:format><dcterms:created>2017</dcterms:created></edm:WebResource></rdf:RDF>'
      );
    }
  );

  it('includes unknown elements in XML generated from model from parsed XML',
    function () {
      // given
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
      const metadataModel = EdmMetadata.fromXml(xmlSource);
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
