/**
 * Model of single EDM property backed by XML element representing that property in the
 * XML document. The property has some text value (not to confuse with the `value`
 * property of this class) that can be stored as XML value or in the `resource` attribute.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EdmAttrs, { namespacedAttr } from './attrs';
import { EdmPropertyMaxOccurrences, EdmPropertyRecommendation, EdmPropertyValueType } from './property-spec';

class EdmProperty {
  static supportedXmlAttrs = Object.freeze([
    'lang',
    'resource',
  ].map(attr => namespacedAttr(attr)));

  /**
   * @param {Element} [options.xmlElement] Provide for properties created from XML.
   * @param {XMLDocument} [options.xmlDocument] Provide for completely new properties (not
   *   from XML).
   * @param {string} [options.namespace] Provide for completely new property.
   * @param {string} [options.edmPropertyType] Provide for completely new property.
   * @param {EdmPropertySpec} [options.spec]
   */
  constructor(options = {}) {
    if (!options.xmlElement && !options.xmlDocument) {
      throw new Error(
        'EDM Property: no xmlElement nor xmlDocument provided in constructor'
      );
    }
    /** @type {Element} */
    this.xmlElement = options.xmlElement;
    if (options.xmlDocument) {
      this.xmlDocument = options.xmlDocument;
    }

    if (this.xmlElement) {
      [this.namespace, this.edmPropertyType] = this.xmlElement.tagName.split(':');
      if (!this.namespace || !this.edmPropertyType) {
        throw new Error(`EDM Property tag not supported: ${this.xmlElement.tagName}`);
      }
    } else {
      this.namespace = options.namespace;
      this.edmPropertyType = options.edmPropertyType;
      this.xmlElement = this.xmlDocument.createElement(this.xmlTagName);
    }
    if (!this.xmlDocument) {
      this.xmlDocument = this.xmlElement.ownerDocument;
    }

    this.attrs = {};
    this.spec = options.spec || {};
  }

  get xmlTagName() {
    return `${this.namespace}:${this.edmPropertyType}`;
  }

  get value() {
    return this.xmlElement.textContent;
  }
  set value(textContent) {
    this.xmlElement.textContent = textContent;
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

  get hasExtraData() {
    for (const attr of this.xmlElement.attributes) {
      if (!EdmProperty.supportedXmlAttrs.includes(attr.name)) {
        return true;
      }
    }
    return false;
  }

  get isUsingResource() {
    return Boolean(!this.value && this.attrs.resource);
  }

  get supportedValueType() {
    return this.spec?.val || EdmPropertyValueType.Any;
  }

  get predefinedValues() {
    return this.spec?.predef;
  }

  get hasPredefinedValues() {
    return Boolean(this.predefinedValues);
  }

  get recommendation() {
    return this.spec?.rec || EdmPropertyRecommendation.None;
  }

  get maxOccurrences() {
    return this.spec?.max || EdmPropertyMaxOccurrences.Any;
  }

  get isLangConfigurable() {
    return this.spec?.lang || false;
  }

  get isPossibleLongValue() {
    return this.spec?.long || false;
  }

  /**
   * @param {EdmProperty} edmProperty
   * @returns {boolean}
   */
  equals(edmProperty) {
    return this.xmlElement === edmProperty.xmlElement;
  }
}

export default EdmProperty;
