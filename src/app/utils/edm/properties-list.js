/**
 * An adapter exposing array of EDM property models based on the XML element that is EDM
 * object. Allows to read and write.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EdmPropertyFactory from './property-factory';
import { isSupportedXmlProperty } from './xml-utils';

export default class EdmPropertiesList {
  /**
   * @param {Element} xmlElement XML element for EDM object
   * @param {Array<EdmProperty>} properties
   */
  constructor(xmlElement, properties) {
    /**
     * EDM object XML element
     * @type {Element}
     */
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

  /**
   * @param {EdmProperty} edmProperty
   */
  addProperty(edmProperty) {
    const newPropertyTagName = edmProperty.xmlTagName;
    const propertyElements = this.xmlElement.children;
    let insertIndex = 0;
    while (
      propertyElements[insertIndex]?.tagName.localeCompare(newPropertyTagName) <= 0
    ) {
      insertIndex += 1;
    }
    this.xmlElement.insertBefore(
      edmProperty.xmlElement,
      propertyElements[insertIndex] || null
    );
  }

  /**
   * @param {EdmProperty} edmProperty
   */
  deleteProperty(edmProperty) {
    this.xmlElement.removeChild(edmProperty.xmlElement);
  }

  /**
   * @returns {Array<EdmProeprty>}
   */
  toArray() {
    const array = [];
    for (const propertyXmlElement of this.xmlElement.children) {
      if (isSupportedXmlProperty(propertyXmlElement)) {
        array.push(EdmPropertyFactory.createPropertyFromXmlElement(propertyXmlElement));
      }
    }
    return array;
  }
}
