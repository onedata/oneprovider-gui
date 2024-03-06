import EdmAttrs from './attrs';
import EdmProperty from './property';

/**
 * @typedef {Object} EdmObjectAttrs
 * @property {string} about Mandatory `rdf:about` property.
 */

// FIXME: można próbować ujednolicić niektóre miejsca w constructor i innych metodach razem z property

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
    this.hasExtraData = options.hasExtraData || false;
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

  // FIXME: implement?
  // getFilledAttrs
}

class EdmPropertiesList {
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
    return Array.from(this.xmlElement.children).map(propertyXmlElement =>
      new EdmProperty({
        xmlElement: propertyXmlElement,
      })
    );
  }
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
