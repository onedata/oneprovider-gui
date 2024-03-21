import EmberObject from '@ember/object';
import EdmMetadata from './metadata';
import ProvidedCHO from './objects/provided-cho';
import Aggregation from './objects/aggregation';
import EdmObjectType from './object-type';
import EdmPropertyFactory from './property-factory';
import EdmObjectFactory from './object-factory';
import { EdmPropertyRecommendation, flatSpecs } from './property-spec';

// FIXME: rozróżnienie na property dla różnych obiektów

/**
 * @typedef {Object} EdmPropertyOptions
 * @property {string} [value] Value of element.
 * @property {string} [resource] `rdf:resource` attribute of element.
 * @property {string} [lang] `xml:lang` attribute of element.
 * @property {string} [about] `rdf:about` attribute of element.
 */

// FIXME: change to native class and non-instance methods
const EdmMetadataFactory = EmberObject.extend({
  //#region state

  //#endregion

  /**
   * @public
   * @param {string} xmlValue
   * @returns {EdmMetadata}
   */
  fromXml(xmlValue) {
    const domParser = new DOMParser();
    /** @type {XMLDocument} */
    const xmlDocument = domParser.parseFromString(xmlValue, 'text/xml');
    return new EdmMetadata(xmlDocument);
  },

  createEmptyMetadata() {
    return new EdmMetadata();
  },

  // FIXME: można uwzględnić dane z share'a
  createInitialMetadata() {
    const metadata = new EdmMetadata();
    const objectFactory = new EdmObjectFactory(metadata);
    const providedCho = objectFactory.createObject(EdmObjectType.ProvidedCHO);
    const aggregation = objectFactory.createObject(EdmObjectType.Aggregation);
    // FIXME: typ
    const initialPropertyItems = flatSpecs.filter(item => {
      return item.spec.rec === EdmPropertyRecommendation.Mandatory ||
        item.spec.rec === EdmPropertyRecommendation.Recommended;
    });
    const providedChoPropertyItems = [];
    const aggregationPropertyItems = [];
    for (const propertyItem of initialPropertyItems) {
      for (const supportedObjectType of propertyItem.spec.obj) {
        if (supportedObjectType === EdmObjectType.ProvidedCHO) {
          providedChoPropertyItems.push(propertyItem);
        }
        if (supportedObjectType === EdmObjectType.Aggregation) {
          aggregationPropertyItems.push(propertyItem);
        }
      }
    }

    const propertyFactory = EdmPropertyFactory.create();
    providedCho.edmProperties = providedChoPropertyItems
      .map(propertyItem => propertyFactory.createProperty(
        metadata,
        propertyItem.namespace,
        propertyItem.name
      ));
    aggregation.edmProperties = aggregationPropertyItems
      .map(propertyItem => propertyFactory.createProperty(
        metadata,
        propertyItem.namespace,
        propertyItem.name
      ));

    metadata.edmObjects = [providedCho, aggregation];

    return metadata;
  },

  // FIXME: przenieść do pliku z mockami, żeby było na dummy
  createMockMetadata() {
    const resourceId = 'urn://eriac/19';
    const metadata = new EdmMetadata();
    const objectFactory = new EdmObjectFactory(metadata);
    const providedCho = objectFactory.createObject(EdmObjectType.ProvidedCHO);
    const aggregation = objectFactory.createObject(EdmObjectType.Aggregation);
    const webResource = objectFactory.createObject(EdmObjectType.WebResource);
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
});

export default EdmMetadataFactory;
