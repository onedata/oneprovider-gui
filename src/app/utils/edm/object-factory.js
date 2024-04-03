import ProvidedCHO from './objects/provided-cho';
import Aggregation from './objects/aggregation';
import WebResource from './objects/web-resource';
import EdmObjectType from './object-type';
import EdmObject, { InvalidEdmObjectType } from './object';
import EdmMetadata from './metadata';
import { EdmPropertyRecommendation, allPropertyData } from './property-spec';
import EdmPropertyFactory from './property-factory';

const objectClasses = {
  [EdmObjectType.Aggregation]: Aggregation,
  [EdmObjectType.ProvidedCHO]: ProvidedCHO,
  [EdmObjectType.WebResource]: WebResource,
};

const initialPropertiesMap = createInitialPropertyMap();

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
    const propertyFactory = new EdmPropertyFactory(this.metadata);
    return this.createObject(edmObjectType, {
      edmProperties: initialPropertiesMap[edmObjectType].map(propertyItem =>
        propertyFactory.createProperty(
          propertyItem.namespace,
          propertyItem.name
        )
      ),
    });
  }
}

/**
 * @returns {Object<EdmObjectType, Array<Object>}
 */
function createInitialPropertyMap() {
  const initialPropertyItems = allPropertyData.filter(item => {
    return item.spec.rec === EdmPropertyRecommendation.Mandatory ||
      item.spec.rec === EdmPropertyRecommendation.Recommended;
  });
  const propertyItems = {
    [EdmObjectType.ProvidedCHO]: [],
    [EdmObjectType.Aggregation]: [],
    [EdmObjectType.WebResource]: [],
  };
  for (const propertyItem of initialPropertyItems) {
    for (const supportedObjectType of propertyItem.spec.obj) {
      propertyItems[supportedObjectType].push(propertyItem);
    }
  }
  return propertyItems;
}

export default EdmObjectFactory;
