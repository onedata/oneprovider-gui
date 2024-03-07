import EdmAttrs from './attrs';
import { isEmptyXmlNode, isSupportedXmlProperty } from './xml-utils';
import EdmPropertiesList from './edm-properties-list';

/**
 * @typedef {Object} EdmObjectAttrs
 * @property {string} about Mandatory `rdf:about` property.
 */

// FIXME: można próbować ujednolicić niektóre miejsca w constructor i innych metodach razem z property

const shownAttrs = Object.freeze(['about']);
const shownXmlAttrs = Object.freeze(['rdf:about']);

export default class EdmObject {
  /**
   * @param {Element} [options.xmlElement] Provide for objects created from XML.
   * @param {XMLDocument} [options.xmlDocument] Provide for completely new object (not
   *   from XML).
   * @param {string} [options.namespace] Provide for completely new object.
   * @param {string} [options.edmPropertyType] Provide for completely new object.
   * @param {boolean} [options.hasExtraData]
   */
  constructor(options) {
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
    } else {
      this.namespace = options.namespace;
      this.edmObjectType = options.edmObjectType;
      this.xmlElement = this.xmlDocument.createElement(this.xmlTagName);
    }
    if (!this.xmlDocument) {
      this.xmlDocument = this.xmlElement.ownerDocument;
    }

    this.attrs = {};
    this.edmProperties = undefined;
    // FIXME: usunąć ręczne ustawianie hasExtraData na instancjach tej klasy
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
    this.__edmProperties = new EdmPropertiesList(this.xmlElement, properties);
  }
  get edmProperties() {
    return this.__edmProperties.toArray();
  }

  get shownAttrs() {
    return shownAttrs;
  }
  get shownXmlAttrs() {
    return shownXmlAttrs;
  }

  get hasExtraData() {
    // FIXME: sprawdzić także to co jest poza root elementem
    for (const attr of this.xmlElement.attributes) {
      if (!this.shownXmlAttrs.includes(attr.name)) {
        return true;
      }
    }
    for (const node of this.xmlElement.childNodes) {
      if (!isEmptyXmlNode(node) && !isSupportedXmlProperty(node)) {
        return true;
      }
    }
    return false;
  }

  // FIXME: implement?
  // getFilledAttrs
}

export class InvalidEdmObjectType extends Error {
  /**
   * @param {string} edmObjectType
   */
  constructor(edmObjectType) {
    super(edmObjectType);
    this.message = `Invalid EDM Object class: ${edmObjectType}`;
    this.name = 'InvalidEdmObjectType';
  }
}
