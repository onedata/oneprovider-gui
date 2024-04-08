/**
 * Model of single EDM object backed by XML element representing that object in the XML
 * document. Contains list of EDM properties - see `EdmProperty` class.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EdmAttrs from './attrs';
import { isEmptyXmlNode, isSupportedXmlProperty, isXmlPropertyCompatibleWithObject } from './xml-utils';
import EdmPropertiesList from './properties-list';
import { sortProperties } from './sort';

/**
 * @typedef {Object} EdmObjectAttrs
 * @property {string} about Mandatory `rdf:about` property.
 */

const shownAttrs = Object.freeze(['about']);
const shownXmlAttrs = Object.freeze(['rdf:about']);

export default class EdmObject {
  /** @type {EdmPropertiesList} */
  #edmPropertiesList = undefined;
  /** @type {Array<EdmProperty>} */
  #edmProperties = undefined;

  /**
   * @param {Element} [options.xmlElement] Provide for objects created from XML.
   * @param {XMLDocument} [options.xmlDocument] Provide for completely new object (not
   *   from XML).
   * @param {string} [options.namespace] Provide for completely new object.
   * @param {string} [options.edmObjectType] Provide for completely new object.
   */
  constructor(options = {}) {
    if (!options.xmlElement && !options.xmlDocument) {
      throw new Error(
        'EDM Object: no xmlElement nor xmlDocument provided in constructor'
      );
    }
    /** @type {Element} */
    this.xmlElement = options.xmlElement;
    if (options.xmlDocument) {
      this.xmlDocument = options.xmlDocument;
    }

    if (this.xmlElement) {
      [this.namespace, this.edmObjectType] = this.xmlElement.tagName.split(':');
      if (!this.namespace || !this.edmObjectType) {
        throw new InvalidEdmObjectType(this.xmlElement.tagName);
      }
      if (!this.xmlDocument) {
        this.xmlDocument = this.xmlElement.ownerDocument;
      }
    } else {
      this.namespace = options.namespace;
      this.edmObjectType = options.edmObjectType;
      this.xmlElement = this.xmlDocument.createElement(this.xmlTagName);
    }

    this.attrs = {};
    this.edmProperties = undefined;
  }

  get xmlTagName() {
    return `${this.namespace}:${this.edmObjectType}`;
  }

  set attrs(valueMap = {}) {
    this.__attrs = new EdmAttrs(this.xmlElement);
    for (const [key, value] of Object.entries(valueMap)) {
      this.__attrs[key] = value;
    }
  }

  get attrs() {
    return this.__attrs;
  }

  /** @param {Array<EdmProperty>} properties */
  set edmProperties(properties) {
    this.#edmPropertiesList = new EdmPropertiesList(this.xmlElement, properties);
    this.#edmProperties = this.#edmPropertiesList.toArray();
  }

  /** @type {Array<EdmProperty>} */
  get edmProperties() {
    return this.#edmProperties;
  }

  get shownAttrs() {
    return shownAttrs;
  }

  get shownXmlAttrs() {
    return shownXmlAttrs;
  }

  get hasExtraData() {
    for (const attr of this.xmlElement.attributes) {
      if (!this.shownXmlAttrs.includes(attr.name)) {
        return true;
      }
    }
    for (const node of this.xmlElement.childNodes) {
      if (
        !isEmptyXmlNode(node) && (
          !isSupportedXmlProperty(node) ||
          !isXmlPropertyCompatibleWithObject(node, this.xmlElement)
        )
      ) {
        return true;
      }
    }
    return false;
  }

  addProperty(edmProperty) {
    this.#edmPropertiesList.addProperty(edmProperty);
    this.#edmProperties = this.#edmPropertiesList.toArray();
  }

  /**
   * @param {EdmProperty} edmProperty
   * @returns {void}
   */
  deleteProperty(edmProperty) {
    this.#edmPropertiesList.deleteProperty(edmProperty);
    this.#edmProperties = this.#edmPropertiesList.toArray();
  }

  /**
   * @returns {void}
   */
  sortProperties() {
    this.#edmPropertiesList.replaceAll(sortProperties(this.edmProperties, 'xml'));
  }
}

export class InvalidEdmObjectType extends Error {
  /**
   * @param {string} edmObjectType
   */
  constructor(edmObjectType) {
    super(`Invalid EDM Object class: ${edmObjectType}`);
    this.name = 'InvalidEdmObjectType';
  }
}
