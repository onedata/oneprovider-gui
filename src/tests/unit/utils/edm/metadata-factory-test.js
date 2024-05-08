import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupTest } from 'ember-mocha';
import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';

describe('Unit | Utility | edm/metadata-factory', function () {
  setupTest('util:edm/metadata-factory', {});

  it('generates EDM metadata model from XML with ProvidedCHO and Aggregation with "about" and some properties',
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
      const metadataModel = factory.fromXml(xmlSource);

      // then
      expect(metadataModel.edmObjects).to.have.lengthOf(2);
      const providedCHO = metadataModel.edmObjects[0];
      expect(providedCHO.edmObjectType).to.equal(EdmObjectType.ProvidedCHO);
      expect(providedCHO.attrs.about).to.equal('#example_direct_Image_1');
      const propertyCreated = providedCHO.edmProperties[0];
      const propertyTitle = providedCHO.edmProperties[1];
      const propertySubject = providedCHO.edmProperties[2];

      expect(propertyCreated.edmPropertyType).to.equal('created');
      expect(propertyCreated.namespace).to.equal('dcterms');
      expect(propertyCreated.value).to.equal('1951');
      expect(propertyCreated.attrs.about).to.equal(null);
      expect(propertyCreated.attrs.lang).to.equal(null);
      expect(propertyCreated.attrs.resource).to.equal(null);
      expect(propertyCreated.hasExtraData, 'created property extra').to.be.false;

      expect(propertyTitle.edmPropertyType).to.equal('title');
      expect(propertyTitle.namespace).to.equal('dc');
      expect(propertyTitle.value).to.equal('Image JPG Example Record Tier 1');
      expect(propertyTitle.attrs.about).to.equal(null);
      expect(propertyTitle.attrs.lang).to.equal('en');
      expect(propertyTitle.attrs.resource).to.equal(null);
      expect(propertyTitle.hasExtraData, 'title property extra').to.be.false;

      expect(propertySubject.edmPropertyType).to.equal('subject');
      expect(propertySubject.namespace).to.equal('dc');
      expect(propertySubject.value).to.be.empty;
      expect(propertySubject.attrs.about).to.equal(null);
      expect(propertySubject.attrs.lang).to.equal(null);
      expect(propertySubject.attrs.resource).to.equal(
        'http://vocab.getty.edu/aat/300020103'
      );
      expect(propertySubject.hasExtraData, 'subject property extra').to.be.false;

      expect(providedCHO.hasExtraData, 'ProvidedCHO extra').to.be.false;

      const aggregation = metadataModel.edmObjects[1];
      expect(aggregation.edmObjectType).to.equal(EdmObjectType.Aggregation);
      expect(aggregation.attrs.about).to.equal('#example_direct_Image_1_AGG');
      const propertyAggregatedCHO = aggregation.edmProperties[0];
      const propertyIsShownBy = aggregation.edmProperties[1];

      expect(propertyAggregatedCHO.edmPropertyType).to.equal('aggregatedCHO');
      expect(propertyAggregatedCHO.namespace).to.equal('edm');
      expect(propertyAggregatedCHO.value).to.be.empty;
      expect(propertyAggregatedCHO.attrs.about).to.equal(null);
      expect(propertyAggregatedCHO.attrs.lang).to.equal(null);
      expect(propertyAggregatedCHO.attrs.resource).to.equal('#example_direct_Image_1');
      expect(propertyAggregatedCHO.hasExtraData, 'aggregatedCHO property extra').to.be.false;

      expect(propertyIsShownBy.edmPropertyType).to.equal('isShownBy');
      expect(propertyIsShownBy.namespace).to.equal('edm');
      expect(propertyIsShownBy.value).to.be.empty;
      expect(propertyIsShownBy.attrs.about).to.equal(null);
      expect(propertyIsShownBy.attrs.lang).to.equal(null);
      expect(propertyIsShownBy.attrs.resource).to.equal(
        'https://sammlung.mak.at/img/1200x1200/publikationsbilder/ki-18709-67-2_1.jpg'
      );
      expect(propertyIsShownBy.hasExtraData, 'isShownBy property extra').to.be.false;

      expect(aggregation.hasExtraData, 'Aggregation extra').to.be.false;
      expect(metadataModel.hasExtraData, 'metadata model extra').to.be.false;
    }
  );

  it('generates EDM metadata model from XML with extra content',
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

      // then
      expect(metadataModel.edmObjects).to.have.lengthOf(1);
      expect(metadataModel.hasExtraData, 'metadata model').to.be.true;
      const providedCHO = metadataModel.edmObjects[0];
      expect(providedCHO.hasExtraData, 'ProvidedCHO extra').to.be.true;
      const edmProperties = providedCHO.edmProperties;
      expect(edmProperties).to.have.lengthOf(1);
      const createdProperty = edmProperties[0];
      expect(createdProperty.edmPropertyType).to.equal('created');
      expect(createdProperty.value).to.equal('1951');
      expect(createdProperty.hasExtraData, 'created property extra').to.be.true;
    }
  );
});
