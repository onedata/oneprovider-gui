import EdmObject, { InvalidEdmObjectType } from './object';
import { supportedEdmObjectTypes } from './object-type';

// FIXME: ujednolicenie z EdmPropertiesList?
export default class EdmObjectsList {
  /**
   * @param {Array<EdmProperty>} objects
   */
  constructor(xmlElement, objects) {
    /** @type {Element} */
    this.xmlElement = xmlElement;
    if (objects) {
      this.replaceAll(objects);
    }
  }

  get xmlDocument() {
    return this.xmlElement.ownerDocument;
  }

  /**
   * @param {Array<EdmProperty>} objects
   */
  replaceAll(objects) {
    const elements = objects.map(object => object.xmlElement);
    this.xmlElement.replaceChildren(...elements);
  }

  toArray() {
    const edmObjects = [];
    for (const objectXmlElement of Array.from(this.xmlElement.children)) {
      try {
        // FIXME: mogłoby używać object factory, ale ono potrzebuje instancji metadata
        const object = new EdmObject({
          xmlElement: objectXmlElement,
        });
        if (supportedEdmObjectTypes.includes(object.edmObjectType)) {
          edmObjects.push(object);
        }
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
