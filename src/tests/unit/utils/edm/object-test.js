import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupTest } from 'ember-mocha';
import EdmObject, { InvalidEdmObjectType } from 'oneprovider-gui/utils/edm/object';
import EdmProperty from 'oneprovider-gui/utils/edm/property';
import EdmMetadata from 'oneprovider-gui/utils/edm/metadata';
import globals from 'onedata-gui-common/utils/globals';
import { setProperties } from '@ember/object';

describe('Unit | Utility | edm/object', function () {
  setupTest('util:edm/object', {});

  it('stores data of the EDM property in the XML Node', function () {
    // given
    const xmlDocument = EdmMetadata.createXmlDocument();
    const edmObject = new EdmObject({
      xmlDocument,
      namespace: 'edm',
      edmObjectType: 'ProvidedCHO',
    });
    const contributorProperty = new EdmProperty({
      xmlDocument,
      namespace: 'dc',
      edmPropertyType: 'contributor',
    });
    setProperties(contributorProperty, {
      value: 'Czesiek',
      attrs: {
        lang: 'en',
        about: 'https://czesiek.onedata.org',
      },
    });
    setProperties(edmObject, {
      attrs: {
        about: 'https://onedata.org',
      },
      edmProperties: [
        contributorProperty,
      ],
    });

    // when
    /** @type {Element} */
    const xmlObjectElement = edmObject.xmlElement;

    // then
    expect(xmlObjectElement).to.be.instanceOf(globals.window.Element);
    expect(xmlObjectElement.tagName).to.equal('edm:ProvidedCHO');
    expect(xmlObjectElement.attributes).to.have.lengthOf(1);
    expect(xmlObjectElement.getAttribute('rdf:about')).to.equal('https://onedata.org');
    expect(Array.from(xmlObjectElement.children)).to.have.lengthOf(1);
    const xmlPropertyElement = xmlObjectElement.children[0];
    expect(xmlPropertyElement.tagName).to.equal('dc:contributor');
    expect(xmlPropertyElement.attributes).to.have.lengthOf(2);
    expect(xmlPropertyElement.getAttribute('xml:lang')).to.equal('en');
    expect(xmlPropertyElement.getAttribute('rdf:about'))
      .to.equal('https://czesiek.onedata.org');
  });

  it('reflects data of the XML Node in the object', function () {
    const xmlSource = `<?xml version="1.0" encoding="UTF-8"?>
    <rdf:RDF
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:dcterms="http://purl.org/dc/terms/"
        xmlns:edm="http://www.europeana.eu/schemas/edm/"
        xmlns:ore="http://www.openarchives.org/ore/terms/"
        xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
        <edm:ProvidedCHO>
            <dcterms:created xml:lang="en">1951</dcterms:created>
        </edm:ProvidedCHO>
    </rdf:RDF>`;
    const domParser = new DOMParser();
    const xmlDoc = domParser.parseFromString(xmlSource, 'text/xml');
    const elementProvidedCHO = xmlDoc.documentElement.children[0];

    const edmObject = new EdmObject({ xmlElement: elementProvidedCHO });

    expect(edmObject.namespace).to.equal('edm');
    expect(edmObject.edmObjectType).to.equal('ProvidedCHO');
    const edmProperties = edmObject.edmProperties;
    expect(edmProperties).to.have.lengthOf(1);
    const createdProperty = edmObject.edmProperties[0];
    expect(createdProperty.namespace).to.equal('dcterms');
    expect(createdProperty.edmPropertyType).to.equal('created');
    expect(Object.keys(createdProperty.attrs)).to.have.lengthOf(1);
    expect(createdProperty.attrs.lang).to.equal('en');
    expect(createdProperty.value).to.equal('1951');
  });

  it('allows to change attributes of the XML Node in the EDM object', function () {
    const xmlSource = `<?xml version="1.0" encoding="UTF-8"?>
    <rdf:RDF
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:dcterms="http://purl.org/dc/terms/"
        xmlns:edm="http://www.europeana.eu/schemas/edm/"
        xmlns:ore="http://www.openarchives.org/ore/terms/"
        xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
        <edm:ProvidedCHO rdf:about="https://onedata.org">
            <dcterms:created xml:lang="en">1951</dcterms:created>
        </edm:ProvidedCHO>
    </rdf:RDF>`;
    const domParser = new DOMParser();
    const xmlDoc = domParser.parseFromString(xmlSource, 'text/xml');
    const objectElement = xmlDoc.documentElement.children[0];

    const edmObject = new EdmObject({ xmlElement: objectElement });
    edmObject.attrs.about = 'https://demo.onedata.org';
    const xmlElement = edmObject.xmlElement;

    expect(xmlElement.getAttribute('rdf:about')).to.equal('https://demo.onedata.org');
  });

  it('allows to change EDM property nodes of the XML Node in the EDM object', function () {
    const xmlSource = `<?xml version="1.0" encoding="UTF-8"?>
    <rdf:RDF
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:dcterms="http://purl.org/dc/terms/"
        xmlns:edm="http://www.europeana.eu/schemas/edm/"
        xmlns:ore="http://www.openarchives.org/ore/terms/"
        xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
        <edm:ProvidedCHO rdf:about="https://onedata.org">
            <dcterms:created xml:lang="en">1951</dcterms:created>
        </edm:ProvidedCHO>
    </rdf:RDF>`;
    const domParser = new DOMParser();
    const xmlDoc = domParser.parseFromString(xmlSource, 'text/xml');
    const objectElement = xmlDoc.documentElement.children[0];

    const edmObject = new EdmObject({ xmlElement: objectElement });
    const contributorProperty = new EdmProperty({
      xmlDocument: edmObject.xmlDocument,
      namespace: 'dc',
      edmPropertyType: 'contributor',
    });
    setProperties(contributorProperty, {
      value: 'Czesiek',
      attrs: {
        lang: 'en',
        about: 'https://czesiek.onedata.org',
      },
    });
    edmObject.edmProperties = [
      contributorProperty,
    ];
    const xmlElement = edmObject.xmlElement;

    /** @type {Element} */
    const xmlPropertyElement = Array.from(xmlElement.children)[0];
    expect(xmlPropertyElement.tagName).to.equal('dc:contributor');
    expect(xmlPropertyElement.getAttribute('xml:lang')).to.equal('en');
    expect(xmlPropertyElement.getAttribute('rdf:about'))
      .to.equal('https://czesiek.onedata.org');
    expect(xmlPropertyElement.innerHTML).to.equal('Czesiek');

    // extra step: changing data of EDM property inside
    contributorProperty.value = 'Test';
    expect(xmlPropertyElement.innerHTML).to.equal('Test');
  });

  it('has InvalidEdmObjectType error class which has own string representation', function () {
    try {
      throw new InvalidEdmObjectType('hello:world');
    } catch (error) {
      expect(error instanceof InvalidEdmObjectType).to.be.true;
      expect(error.name).to.equal('InvalidEdmObjectType');
      expect(error.toString()).to.equal(
        'InvalidEdmObjectType: Invalid EDM Object class: hello:world'
      );
    }
  });
});
