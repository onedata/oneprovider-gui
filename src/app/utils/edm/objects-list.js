import { InvalidEdmObjectType } from './object';
import EdmObjectFactory from './object-factory';
import { supportedEdmObjectTypes } from './object-type';

export default class EdmObjectsList {
  /**
   * @param {Element} xmlElement XML element for EDM object
   * @param {Array<EdmObject>} objects
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

  /**
   * @param {EdmObject} edmObject
   */
  addObject(edmObject) {
    this.xmlElement.appendChild(edmObject.xmlElement);
  }

  /**
   * @param {EdmObject} edmObject
   */
  deleteObject(edmObject) {
    this.xmlElement.removeChild(edmObject.xmlElement);
  }

  toArray() {
    const edmObjects = [];
    for (const objectXmlElement of Array.from(this.xmlElement.children)) {
      try {
        const object = EdmObjectFactory.createObjectFromXmlElement(objectXmlElement);
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
}
