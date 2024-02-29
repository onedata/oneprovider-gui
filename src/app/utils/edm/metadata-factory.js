import EmberObject from '@ember/object';
import EdmMetadata from './metadata';
import ProvidedCho from './objects/provided-cho';
import Aggregation from './objects/aggregation';
import WebResource from './objects/web-resource';
import propertyClasses from './property-classes';
import _ from 'lodash';

// FIXME: rozróżnienie na property dla różnych obiektów

/**
 * @typedef {Object} EdmPropertyOptions
 * @property {string} [value] Value of element.
 * @property {string} [resource] `rdf:resource` attribute of element.
 * @property {string} [lang] `xml:lang` attribute of element.
 * @property {string} [about] `rdf:about` attribute of element.
 */

export default EmberObject.extend({
  //#region state

  //#endregion

  createInitialEdmMetadata() {
    const providedCho = ProvidedCho.create();
    const aggregation = Aggregation.create();
    return EdmMetadata.create({
      edmObjects: [providedCho, aggregation],
    });
  },

  // FIXME: to remove on production
  createMockEdmMetadata() {
    const resourceId = 'urn://eriac/19';
    const providedCho = ProvidedCho.create({
      attrs: {
        about: resourceId,
      },
      edmProperties: [
        this.createProperty('dc', 'contributor', {
          value: 'ERIAC',
          lang: 'en',
        }),
        this.createProperty('dc', 'contributor', {
          value: 'ERIAC Archive',
          lang: 'en',
        }),
        this.createProperty('dc', 'date', {
          value: '2018-03-13',
          lang: 'en',
        }),
        this.createProperty('dc', 'description', {
          value: 'Artwork "Romani Kali Daj II" by Małgorzata Mirga-Tas at the exhibition "Hidden Roma Masterpieces"',
          lang: 'en',
        }),
        this.createProperty('dc', 'identifier', {
          value: '19',
          lang: 'en',
        }),
        // ...
        this.createProperty('dc', 'subject', {
          resource: 'http://vocab.getty.edu/aat/300389150',
        }),
        this.createProperty('dc', 'subject', {
          resource: 'http://www.wikidata.org/entity/Q8060',
        }),
        // ...
        this.createProperty('dc', 'subject', {
          value: 'arts',
        }),
        this.createProperty('dc', 'subject', {
          value: 'culture',
        }),
        // ...
        this.createProperty('dc', 'type', {
          value: 'Image',
          lang: 'en',
        }),
        // ...
        this.createProperty('dcterms', 'created', {
          value: '2018-03-13',
        }),
        // ...
        this.createProperty('edm', 'type', {
          value: 'IMAGE',
        }),
      ],
    });
    const aggregation = Aggregation.create({
      attrs: {
        about: resourceId,
      },
      edmProperties: [
        this.createProperty('edm', 'type', {
          value: 'IMAGE',
        }),
        this.createProperty('edm', 'dataProvider', {
          value: 'ERIAC',
          lang: 'en',
        }),
        this.createProperty('edm', 'isShownBy', {
          resource: 'https://eriac.org/wp-content/uploads/2018/03/IMG_1578-1200x800.jpg',
        }),
      ],
    });
    const webResource = WebResource.create({
      attrs: {
        about: resourceId,
      },
      edmProperties: [
        this.createProperty('edm', 'aggregatedCHO', {
          resource: resourceId,
        }),
        this.createProperty('edm', 'dataProvider', {
          value: 'ERIAC',
          lang: 'en',
        }),
      ],
    });
    return EdmMetadata.create({
      edmObjects: [providedCho, aggregation, webResource],
    });
  },

  /**
   *
   * @param {EdmPropertyNamespace} namespace
   * @param {EdmPropertyName} propertyName
   * @param {EdmPropertyOptions} options
   * @returns {Utils.Edm.EdmProperty}
   */
  createProperty(namespace, propertyName, options) {
    // FIXME: throw error when invalid namespace/name or optional chaining
    const attrs = _.cloneDeep(options);
    delete attrs.value;
    // FIXME: debug
    const propertyClass = propertyClasses[namespace]?.[propertyName];
    if (propertyClass) {
      return propertyClasses[namespace][propertyName].create({
        value: options.value,
        attrs,
      });
    } else {
      console.error(`No property to create: ${namespace}, ${propertyName}`);
    }
  },
});
