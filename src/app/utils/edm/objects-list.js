/**
 * An adapter exposing array of EDM object models based on the XML element that is EDM
 * metadata root. Allows to read and write.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { InvalidEdmObjectType } from './object';
import EdmObjectFactory from './object-factory';
import EdmObjectType, { EdmObjectTagName, supportedEdmObjectTypes } from './object-type';
import _ from 'lodash';

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
    if (edmObject.edmObjectType === EdmObjectType.WebResource) {
      const lastCho = _.findLast(
        Array.from(this.xmlElement.children),
        element => element.tagName === EdmObjectTagName[EdmObjectType.ProvidedCHO]
      );
      if (lastCho) {
        lastCho.insertAdjacentElement('afterend', edmObject.xmlElement);
        return;
      }
    }
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
