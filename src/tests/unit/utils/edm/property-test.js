import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupTest } from 'ember-mocha';
import EdmProperty from 'oneprovider-gui/utils/edm/property';
import EdmMetadata from 'oneprovider-gui/utils/edm/metadata';
import globals from 'onedata-gui-common/utils/globals';
import { setProperties } from '@ember/object';

describe('Unit | Utility | edm/property', function () {
  setupTest('util:edm/property', {});

  it('stores data of the EDM property in the XML Node', function () {
    // given
    const edmProperty = new EdmProperty({
      xmlDocument: EdmMetadata.createXmlDocument(),
      namespace: 'dc',
      edmPropertyType: 'contributor',
    });
    setProperties(edmProperty, {
      value: 'Czesiek',
      attrs: {
        lang: 'en',
        about: 'https://onedata.org',
      },
    });

    // when
    /** @type {Element} */
    const xmlElement = edmProperty.xmlElement;

    // then
    expect(xmlElement).to.be.instanceOf(globals.window.Element);
    expect(xmlElement.tagName).to.equal('dc:contributor');
    expect(xmlElement.textContent).to.equal('Czesiek');
    const expectedAttrs = [
      ['xml:lang', 'en'],
      ['rdf:about', 'https://onedata.org'],
    ];
    expect(xmlElement.attributes).to.have.lengthOf(2);
    for (const [attrName, attrValue] of expectedAttrs) {
      expect(xmlElement.getAttribute(attrName)).to.equal(attrValue);
    }
  });

  it('reflects data of the XML Node in the EDM property properties', function () {
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
    const elementCreated = xmlDoc.documentElement.children[0].children[0];

    const edmProperty = new EdmProperty({ xmlElement: elementCreated });

    expect(edmProperty.namespace).to.equal('dcterms');
    expect(edmProperty.edmPropertyType).to.equal('created');
    expect(edmProperty.attrs.lang).to.equal('en');
    expect(edmProperty.value).to.equal('1951');
  });

  it('allows to change data of the XML Node in the EDM property', function () {
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
    const elementCreated = xmlDoc.documentElement.children[0].children[0];

    const edmProperty = new EdmProperty({ xmlElement: elementCreated });
    edmProperty.attrs.lang = 'pl';
    edmProperty.value = '2024';
    const xmlElement = edmProperty.xmlElement;

    expect(xmlElement.getAttribute('xml:lang')).to.equal('pl');
    expect(xmlElement.innerHTML).to.equal('2024');
  });
});
