// import EdmMetadataFactory from './metadata-factory';
import EdmPropertyFactory from './property-factory';
import { isSupportedXmlProperty } from './xml-utils';

export default class EdmPropertiesList {
  /**
   * @param {Array<EdmProperty>} properties
   */
  constructor(xmlElement, properties) {
    /** @type {Element} */
    this.xmlElement = xmlElement;
    if (properties) {
      this.replaceAll(properties);
    }
  }

  get xmlDocument() {
    return this.xmlElement.ownerDocument;
  }

  /**
   * @param {Array<EdmProperty>} properties
   */
  replaceAll(properties) {
    const elements = properties.map(property => property.xmlElement);
    this.xmlElement.replaceChildren(...elements);
  }

  toArray() {
    const factory = EdmPropertyFactory.create();
    const array = [];
    for (const propertyXmlElement of this.xmlElement.children) {
      if (isSupportedXmlProperty(propertyXmlElement)) {
        array.push(factory.createPropertyFromXml(propertyXmlElement));
      }
    }
    return array;
  }
}
