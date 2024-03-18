import ProvidedCHO from './objects/provided-cho';
import Aggregation from './objects/aggregation';
import WebResource from './objects/web-resource';
import EdmObjectType from './object-type';
import { InvalidEdmObjectType } from './object';
import EdmMetadata from './metadata';

const objectClasses = {
  [EdmObjectType.Aggregation]: Aggregation,
  [EdmObjectType.ProvidedCHO]: ProvidedCHO,
  [EdmObjectType.WebResource]: WebResource,
};

class EdmObjectFactory {
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
   * @param {{ [about]: string, [properties]: Array<EdmProperty>, [hasExtraData]: boolean }} options
   * @returns {Utils.Edm.Object}
   */
  createObject(edmObjectType, options = {}) {
    const objectClass = objectClasses[edmObjectType];
    if (!objectClass) {
      throw new InvalidEdmObjectType('edmObjectType');
    }
    const edmObject = new objectClasses[edmObjectType]({
      xmlDocument: this.metadata.xmlDocument,
      hasExtraData: options.hasExtraData,
    });
    edmObject.attrs = options.attrs;
    edmObject.edmProperties = options.edmProperties;
    return edmObject;
  }
}

export default EdmObjectFactory;
