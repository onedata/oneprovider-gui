import EmberObject from '@ember/object';
import EdmMetadata from './metadata';
import ProvidedCHO from './objects/provided-cho';
import Aggregation from './objects/aggregation';
import WebResource from './objects/web-resource';
import EdmObjectType from './object-type';
import EdmXmlParser from './xml-parser';
import EdmPropertyFactory from './property-factory';
import { InvalidEdmObjectType } from './object';

// FIXME: rozróżnienie na property dla różnych obiektów

/**
 * @typedef {Object} EdmPropertyOptions
 * @property {string} [value] Value of element.
 * @property {string} [resource] `rdf:resource` attribute of element.
 * @property {string} [lang] `xml:lang` attribute of element.
 * @property {string} [about] `rdf:about` attribute of element.
 */

const objectClasses = {
  [EdmObjectType.Aggregation]: Aggregation,
  [EdmObjectType.ProvidedCHO]: ProvidedCHO,
  [EdmObjectType.WebResource]: WebResource,
};

const EdmMetadataFactory = EmberObject.extend({
  //#region state

  //#endregion

  createEmptyMetadata() {
    return new EdmMetadata();
  },

  // FIXME: zastąpione przez statyczną metodę w EdmMetadata
  createInitialMetadata() {
    const metadata = new EdmMetadata();
    const providedCho = new ProvidedCHO();
    const aggregation = new Aggregation();
    metadata.edmObjects = [providedCho, aggregation];
    return metadata;
  },

  // FIXME: przenieść do pliku z mockami, żeby było na dummy
  createMockMetadata() {
    const resourceId = 'urn://eriac/19';
    const metadata = new EdmMetadata();
    const providedCho = this.createObject(metadata, EdmObjectType.ProvidedCHO);
    const aggregation = this.createObject(metadata, EdmObjectType.Aggregation);
    const webResource = this.createObject(metadata, EdmObjectType.WebResource);
    metadata.edmObjects = [providedCho, aggregation, webResource];
    providedCho.attrs = {
      about: resourceId,
    };
    const propertyFactory = EdmPropertyFactory.create();
    providedCho.edmProperties = [
      propertyFactory.createProperty(metadata, 'dc', 'contributor', {
        value: 'ERIAC',
        lang: 'en',
      }),
      propertyFactory.createProperty(metadata, 'dc', 'contributor', {
        value: 'ERIAC Archive',
        lang: 'en',
      }),
      propertyFactory.createProperty(metadata, 'dc', 'date', {
        value: '2018-03-13',
        lang: 'en',
      }),
      propertyFactory.createProperty(metadata, 'dc', 'description', {
        value: 'Artwork "Romani Kali Daj II" by Małgorzata Mirga-Tas at the exhibition "Hidden Roma Masterpieces"',
        lang: 'en',
      }),
      propertyFactory.createProperty(metadata, 'dc', 'identifier', {
        value: '19',
        lang: 'en',
      }),
      // ...
      propertyFactory.createProperty(metadata, 'dc', 'subject', {
        resource: 'http://vocab.getty.edu/aat/300389150',
      }),
      propertyFactory.createProperty(metadata, 'dc', 'subject', {
        resource: 'http://www.wikidata.org/entity/Q8060',
      }),
      // ...
      propertyFactory.createProperty(metadata, 'dc', 'subject', {
        value: 'arts',
      }),
      propertyFactory.createProperty(metadata, 'dc', 'subject', {
        value: 'culture',
      }),
      // ...
      propertyFactory.createProperty(metadata, 'dc', 'type', {
        value: 'Image',
        lang: 'en',
      }),
      // ...
      propertyFactory.createProperty(metadata, 'dcterms', 'created', {
        value: '2018-03-13',
      }),
      // ...
      propertyFactory.createProperty(metadata, 'edm', 'type', {
        value: 'IMAGE',
      }),
    ];
    aggregation.attrs = {
      about: resourceId,
    };
    aggregation.edmProperties = [
      propertyFactory.createProperty(metadata, 'edm', 'type', {
        value: 'IMAGE',
      }),
      propertyFactory.createProperty(metadata, 'edm', 'dataProvider', {
        value: 'ERIAC',
        lang: 'en',
      }),
      propertyFactory.createProperty(metadata, 'edm', 'isShownBy', {
        resource: 'https://eriac.org/wp-content/uploads/2018/03/IMG_1578-1200x800.jpg',
      }),
    ];
    webResource.attrs = {
      about: resourceId,
    };
    webResource.edmProperties = [
      propertyFactory.createProperty(metadata, 'edm', 'aggregatedCHO', {
        resource: resourceId,
      }),
      propertyFactory.createProperty(metadata, 'edm', 'dataProvider', {
        value: 'ERIAC',
        lang: 'en',
      }),
    ];
    return metadata;
  },

  /**
   * @param {string} xmlSource
   * @returns {Utils.Edm.Metadata}
   */
  parseXml(xmlSource) {
    return new EdmXmlParser(xmlSource).createModel(this);
  },

  /**
   * @param {EdmMetadata} edmMetadata
   * @param {EdmObjectType} edmObjectType
   * @param {{ [about]: string, [properties]: Array<EdmProperty>, [hasExtraData]: boolean }} options
   * @returns {Utils.Edm.Object}
   */
  createObject(edmMetadata, edmObjectType, options = {}) {
    const objectClass = objectClasses[edmObjectType];
    if (!objectClass) {
      throw new InvalidEdmObjectType('edmObjectType');
    }
    const edmObject = new objectClasses[edmObjectType]({
      xmlDocument: edmMetadata.xmlDocument,
      hasExtraData: options.hasExtraData,
    });
    edmObject.attrs = options.attrs;
    edmObject.edmProperties = options.edmProperties;
    return edmObject;
  },
});

export default EdmMetadataFactory;
