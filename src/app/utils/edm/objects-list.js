import EdmObject, { InvalidEdmObjectType } from './object';

// FIXME: ujednolicenie z EdmPropertiesList?
export default class EdmObjectsList {
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
    const edmObjects = [];
    for (const objectXmlElement of Array.from(this.xmlElement.children)) {
      try {
        const object = new EdmObject({
          xmlElement: objectXmlElement,
        });
        edmObjects.push(object);
      } catch (error) {
        if (error instanceof InvalidEdmObjectType) {
          continue;
        } else {
          throw error;
        }
      }
    }
    return edmObjects;
  }

  // FIXME: zablokować metody typowe dla Array, albo zrobić metody, które będą działać jako immutable
}
