import EmberObject from '@ember/object';
import EdmMetadata from './metadata';
import ProvidedCHO from './objects/provided-cho';
import Aggregation from './objects/aggregation';
import WebResource from './objects/web-resource';
import EdmProperty from './property';
import EdmObjectType from './object-type';
import EdmXmlParser from './xml-parser';
import _ from 'lodash';
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
    providedCho.edmProperties = [
      this.createProperty(metadata, 'dc', 'contributor', {
        value: 'ERIAC',
        lang: 'en',
      }),
      this.createProperty(metadata, 'dc', 'contributor', {
        value: 'ERIAC Archive',
        lang: 'en',
      }),
      this.createProperty(metadata, 'dc', 'date', {
        value: '2018-03-13',
        lang: 'en',
      }),
      this.createProperty(metadata, 'dc', 'description', {
        value: 'Artwork "Romani Kali Daj II" by Małgorzata Mirga-Tas at the exhibition "Hidden Roma Masterpieces"',
        lang: 'en',
      }),
      this.createProperty(metadata, 'dc', 'identifier', {
        value: '19',
        lang: 'en',
      }),
      // ...
      this.createProperty(metadata, 'dc', 'subject', {
        resource: 'http://vocab.getty.edu/aat/300389150',
      }),
      this.createProperty(metadata, 'dc', 'subject', {
        resource: 'http://www.wikidata.org/entity/Q8060',
      }),
      // ...
      this.createProperty(metadata, 'dc', 'subject', {
        value: 'arts',
      }),
      this.createProperty(metadata, 'dc', 'subject', {
        value: 'culture',
      }),
      // ...
      this.createProperty(metadata, 'dc', 'type', {
        value: 'Image',
        lang: 'en',
      }),
      // ...
      this.createProperty(metadata, 'dcterms', 'created', {
        value: '2018-03-13',
      }),
      // ...
      this.createProperty(metadata, 'edm', 'type', {
        value: 'IMAGE',
      }),
    ];
    aggregation.attrs = {
      about: resourceId,
    };
    aggregation.edmProperties = [
      this.createProperty(metadata, 'edm', 'type', {
        value: 'IMAGE',
      }),
      this.createProperty(metadata, 'edm', 'dataProvider', {
        value: 'ERIAC',
        lang: 'en',
      }),
      this.createProperty(metadata, 'edm', 'isShownBy', {
        resource: 'https://eriac.org/wp-content/uploads/2018/03/IMG_1578-1200x800.jpg',
      }),
    ];
    webResource.attrs = {
      about: resourceId,
    };
    webResource.edmProperties = [
      this.createProperty(metadata, 'edm', 'aggregatedCHO', {
        resource: resourceId,
      }),
      this.createProperty(metadata, 'edm', 'dataProvider', {
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

  // FIXME: skoro tutaj operuję na koncepcji modelu to mogę nie wymagać podawania namespace
  // tylko samego property name (namespace będzie wzięte ze specyfikacji)

  /**
   * @param {EdmMetadata} edmMetadata
   * @param {EdmPropertyNamespace} namespace
   * @param {EdmPropertyName} propertyName
   * @param {EdmPropertyOptions} options
   * @returns {Utils.Edm.Property}
   */
  createProperty(edmMetadata, namespace, propertyName, options = {}) {
    // FIXME: check / throw error when invalid namespace/name
    const edmProperty = new EdmProperty({
      xmlDocument: edmMetadata.xmlDocument,
      namespace,
      edmPropertyType: propertyName,
    });
    edmProperty.value = options.value;
    const attrs = _.cloneDeep(options);
    delete attrs.value;
    edmProperty.attrs = attrs;
    return edmProperty;
  },
});

export default EdmMetadataFactory;
