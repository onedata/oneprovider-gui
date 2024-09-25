/**
 * Produces `EdmObject` instances from provided data or XML elements (parts of EDM XML
 * metadata document).
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import ProvidedCHO from './objects/provided-cho';
import Aggregation from './objects/aggregation';
import WebResource from './objects/web-resource';
import EdmObjectType from './object-type';
import EdmObject, { InvalidEdmObjectType } from './object';
import EdmMetadata from './metadata';
import { EdmPropertyRecommendation, getAllPropertyData } from './property-spec';
import EdmPropertyFactory from './property-factory';

const objectClasses = {
  [EdmObjectType.Aggregation]: Aggregation,
  [EdmObjectType.ProvidedCHO]: ProvidedCHO,
  [EdmObjectType.WebResource]: WebResource,
};

let initialPropertiesMapCache;

function getInitialPropertiesMap() {
  return initialPropertiesMapCache ??= createInitialPropertyMap();
}

class EdmObjectFactory {
  /**
   * @param {Element} xmlElement
   * @returns {EdmObject}
   */
  static createObjectFromXmlElement(xmlElement) {
    return new EdmObject({ xmlElement });
  }

  /**
   * @param {EdmMetadata} metadata
   */
  constructor(metadata) {
    if (!metadata || !(metadata instanceof EdmMetadata)) {
      throw new Error('EdmObjectFactory needs EdmMetadata to be provided in constructor');
    }
    /**
     * @type {EdmMetadata}
     */
    this.metadata = metadata;

    // optional properties

    /**
     * Add a reference to share.rootFile to be able to set default value for file size
     * property. If this property is not set - file size will have an undefined default
     * value.
     * @type {Models.File}
     */
    this.shareRootFile = undefined;
  }

  /**
   * @param {EdmMetadata} edmMetadata
   * @param {EdmObjectType} edmObjectType
   * @param {{ [attrs]: Object, [properties]: Array<EdmProperty> }} options
   * @returns {Utils.Edm.Object}
   */
  createObject(edmObjectType, options = {}) {
    const objectClass = objectClasses[edmObjectType];
    if (!objectClass) {
      throw new InvalidEdmObjectType('edmObjectType');
    }
    const edmObject = new objectClasses[edmObjectType]({
      xmlDocument: this.metadata.xmlDocument,
    });
    edmObject.attrs = options.attrs;
    edmObject.edmProperties = options.edmProperties;
    return edmObject;
  }

  createInitialObject(edmObjectType) {
    const propertyFactory = new EdmPropertyFactory(this.metadata, edmObjectType);
    propertyFactory.shareRootFile = this.shareRootFile;
    const edmProperties = getInitialPropertiesMap()[edmObjectType].map(propertyItem =>
      propertyFactory.createProperty(
        propertyItem.namespace,
        propertyItem.name
      )
    );
    if (edmObjectType === EdmObjectType.ProvidedCHO) {
      let partOfProperty = edmProperties.find(property =>
        property.xmlTagName === 'dcterms:isPartOf'
      );
      if (!partOfProperty) {
        partOfProperty = propertyFactory.createProperty('dcterms', 'isPartOf');
        edmProperties.push(partOfProperty);
      }
      partOfProperty.setSupportedValue('Eureka3D');
    }
    return this.createObject(edmObjectType, {
      edmProperties,
    });
  }
}

/**
 * @returns {Object<EdmObjectType, Array<Object>}
 */
function createInitialPropertyMap() {
  const initialPropertyItems = getAllPropertyData().filter(item => {
    return item.spec.rec === EdmPropertyRecommendation.Mandatory;
  });
  const propertyItems = {
    [EdmObjectType.ProvidedCHO]: [],
    [EdmObjectType.Aggregation]: [],
    [EdmObjectType.WebResource]: [],
  };
  for (const propertyItem of initialPropertyItems) {
    propertyItems[propertyItem.spec.obj].push(propertyItem);
  }
  return propertyItems;
}

export default EdmObjectFactory;
