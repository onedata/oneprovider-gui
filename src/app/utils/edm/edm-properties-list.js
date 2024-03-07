import EdmProperty from './property';
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
    const array = [];
    for (const propertyXmlElement of this.xmlElement.children) {
      if (isSupportedXmlProperty(propertyXmlElement)) {
        array.push(new EdmProperty({ xmlElement: propertyXmlElement }));
      }
    }
    return array;
  }
}
