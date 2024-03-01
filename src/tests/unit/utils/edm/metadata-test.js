import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupTest } from 'ember-mocha';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';

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
        `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:edm="http://www.europeana.eu/schemas/edm/" xmlns:ore="http://www.openarchives.org/ore/terms/"/>`
      );
    }
  );

  it('generates XML from EDM metadata model with some EDM objects and properties',
    function () {
      // given
      const factory = EdmMetadataFactory.create();
      const metadataModel = factory.createEmptyMetadata();
      const resourceId = 'urn://eriac/19';
      const providedCho = factory.createObject(EdmObjectType.ProvidedCHO, {
        about: resourceId,
        properties: [
          factory.createProperty('dc', 'contributor', {
            value: 'ERIAC',
            lang: 'en',
          }),
          factory.createProperty('dcterms', 'created', {
            value: '2018-03-13',
          }),
        ],
      });
      const aggregation = factory.createObject(EdmObjectType.Aggregation, {
        about: resourceId,
        properties: [
          factory.createProperty('edm', 'aggregatedCHO', {
            resource: '#example_direct_Image_1',
          }),
          factory.createProperty('edm', 'isShownBy', {
            resource: 'https://sammlung.mak.at/img/1200x1200/publikationsbilder/ki-18709-67-2_1.jpg',
          }),
        ],
      });
      const webResource = factory.createObject(EdmObjectType.WebResource, {
        about: 'https://sammlung.mak.at/img/1200x1200/publikationsbilder/ki-18709-67-2_1.jpg',
        properties: [
          factory.createProperty('dc', 'format', {
            value: 'jpg',
          }),
          factory.createProperty('dcterms', 'created', {
            value: '2017',
          }),
        ],
      });
      metadataModel.edmObjects.push(providedCho, aggregation, webResource);

      // when
      const resultXml = metadataModel.stringify();

      // then
      expect(resultXml).to.contain(
        '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:edm="http://www.europeana.eu/schemas/edm/" xmlns:ore="http://www.openarchives.org/ore/terms/"><edm:ProvidedCHO rdf:about="urn://eriac/19"><dc:contributor xml:lang="en">ERIAC</dc:contributor><dcterms:created>2018-03-13</dcterms:created></edm:ProvidedCHO><ore:Aggregation rdf:about="urn://eriac/19"><edm:aggregatedCHO rdf:resource="#example_direct_Image_1"/><edm:isShownBy rdf:resource="https://sammlung.mak.at/img/1200x1200/publikationsbilder/ki-18709-67-2_1.jpg"/></ore:Aggregation><edm:WebResource rdf:about="https://sammlung.mak.at/img/1200x1200/publikationsbilder/ki-18709-67-2_1.jpg"><dc:format>jpg</dc:format><dcterms:created>2017</dcterms:created></edm:WebResource></rdf:RDF>'
      );
    }
  );
});
