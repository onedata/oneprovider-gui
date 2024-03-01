import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupTest } from 'ember-mocha';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';
import { get } from '@ember/object';

describe('Unit | Utility | edm/metadata-factory', function () {
  setupTest('util:edm/metadata-factory', {});

  it('generates EDM metadata model from XML with ProvidedCHO and Aggregation with "about" and some properties',
    function () {
      // given
      const factory = EdmMetadataFactory.create();
      const xmlSource = `<?xml version="1.0" encoding="UTF-8"?>
      <rdf:RDF
          xmlns:dc="http://purl.org/dc/elements/1.1/"
          xmlns:dcterms="http://purl.org/dc/terms/"
          xmlns:edm="http://www.europeana.eu/schemas/edm/"
          xmlns:ore="http://www.openarchives.org/ore/terms/"
          xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
          <edm:ProvidedCHO rdf:about="#example_direct_Image_1">
              <dcterms:created>1951</dcterms:created>
              <dc:title xml:lang="en">Image JPG Example Record Tier 1</dc:title>
              <dc:subject rdf:resource="http://vocab.getty.edu/aat/300020103"/>
          </edm:ProvidedCHO>
          <ore:Aggregation rdf:about="#example_direct_Image_1_AGG">
              <edm:aggregatedCHO rdf:resource="#example_direct_Image_1"/>
              <edm:isShownBy rdf:resource="https://sammlung.mak.at/img/1200x1200/publikationsbilder/ki-18709-67-2_1.jpg"/>
          </ore:Aggregation>
      </rdf:RDF>`;

      // when
      const metadataModel = factory.parseXml(xmlSource);

      // then
      expect(metadataModel.edmObjects).to.have.lengthOf(2);
      const providedCHO = metadataModel.edmObjects[0];
      expect(get(providedCHO, 'edmObjectType')).to.equal(EdmObjectType.ProvidedCHO);
      expect(get(providedCHO, 'attrs.about')).to.equal('#example_direct_Image_1');
      const propertyCreated = providedCHO.edmProperties[0];
      const propertyTitle = providedCHO.edmProperties[1];
      const propertySubject = providedCHO.edmProperties[2];

      expect(get(propertyCreated, 'edmPropertyType')).to.equal('created');
      expect(get(propertyCreated, 'namespace')).to.equal('dcterms');
      expect(get(propertyCreated, 'value')).to.equal('1951');
      expect(get(propertyCreated, 'attrs')).to.deep.equal({
        about: null,
        lang: null,
        resource: null,
      });

      expect(get(propertyTitle, 'edmPropertyType')).to.equal('title');
      expect(get(propertyTitle, 'namespace')).to.equal('dc');
      expect(get(propertyTitle, 'value')).to.equal('Image JPG Example Record Tier 1');
      expect(get(propertyTitle, 'attrs')).to.deep.equal({
        about: null,
        lang: 'en',
        resource: null,
      });

      expect(get(propertySubject, 'edmPropertyType')).to.equal('subject');
      expect(get(propertySubject, 'namespace')).to.equal('dc');
      expect(get(propertySubject, 'value')).to.be.empty;
      expect(get(propertySubject, 'attrs')).to.deep.equal({
        about: null,
        lang: null,
        resource: 'http://vocab.getty.edu/aat/300020103',
      });

      // FIXME: sprawdzić działanie tych testów

      // const aggregation = metadataModel.edmObjects[1];
      // expect(get(aggregation, 'edmObjectType')).to.equal(EdmObjectType.Aggregation);
      // expect(get(aggregation, 'attrs.about')).to.equal('#example_direct_Image_1_AGG');
      // const propertyAggregatedCHO = aggregation.edmProperties[0];
      // const propertyIsShownBy = aggregation.edmProperties[1];

      // expect(get(propertyAggregatedCHO, 'edmPropertyType')).to.equal('aggregatedCHO');
      // expect(get(propertyAggregatedCHO, 'namespace')).to.equal('edm');
      // expect(get(propertyAggregatedCHO, 'value')).to.be.empty;
      // expect(get(propertyAggregatedCHO, 'attrs')).to.deep.equal({
      //   about: null,
      //   lang: null,
      //   resource: '#example_direct_Image_1',
      // });

      // expect(get(propertyIsShownBy, 'edmPropertyType')).to.equal('isShownBy');
      // expect(get(propertyIsShownBy, 'namespace')).to.equal('edm');
      // expect(get(propertyIsShownBy, 'value')).to.be.empty;
      // expect(get(propertyIsShownBy, 'attrs')).to.deep.equal({
      //   about: null,
      //   lang: null,
      //   resource: 'https://sammlung.mak.at/img/1200x1200/publikationsbilder/ki-18709-67-2_1.jpg',
      // });
    }
  );
});
