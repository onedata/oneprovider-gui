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

    /** @type {EdmPropertySpec} */
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
    return Boolean(!this.value && this.attrs.resource != null);
  }

  get currentValueType() {
    return this.isUsingResource ?
      EdmPropertyValueType.Reference : EdmPropertyValueType.Literal;
  }

  get supportedValueType() {
    return this.spec?.val || EdmPropertyValueType.Any;
  }

  get predefinedValues() {
    const predef = this.spec?.predef;
    if (!predef) {
      return undefined;
    }
    if (Array.isArray(predef)) {
      return predef;
    }
    if (typeof predef === 'object') {
      return predef[this.currentValueType];
    }
    return undefined;
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
   * @returns {string}
   */
  get example() {
    return this.spec?.example;
  }

  /**
   * Language code that can be found in src/app/utils/edm/lang-spec.js
   * @returns {string}
   */
  get lang() {
    return this.attrs.lang;
  }

  set lang(value) {
    this.attrs.lang = value;
  }

  /**
   * @type {string|{ [EdmPropertyValueType.Literal]: string, [EdmPropertyValueType.Reference]: string }|undefined}
   */
  get placeholderExample() {
    return this.spec.placeholder ?? undefined;
  }

  get isAlwaysDisabled() {
    return this.spec.disabled ?? false;
  }

  get isCustomValueAllowed() {
    return this.spec.custom ?? false;
  }

  /**
   * Sets either value or resource attribute depending on the supported value type and
   * removes value from the other value types.
   * @param {string} value
   */
  setSupportedValue(value) {
    switch (this.supportedValueType) {
      case EdmPropertyValueType.Any:
      case EdmPropertyValueType.Literal:
        this.value = value;
        this.attrs.resource = null;
        break;
      case EdmPropertyValueType.Reference:
        this.attrs.resource = value;
        this.value = null;
        break;
      default:
        break;
    }
  }

  /**
   * Gets either value or resource attribute depending on the supported value type (or
   * actual value if both are supported).
   * @returns {string|undefined}
   */
  getSupportedValue() {
    switch (this.supportedValueType) {
      case EdmPropertyValueType.Any:
        return this.value || this.attrs.resource;
      case EdmPropertyValueType.Literal:
        return this.value;
      case EdmPropertyValueType.Reference:
        return this.attrs.resource;
      default:
        break;
    }
  }

  /**
   * @param {EdmProperty} edmProperty
   * @returns {boolean}
   */
  equals(edmProperty) {
    return this.xmlElement === edmProperty.xmlElement;
  }

  setDefaultValue() {
    this.setSupportedValue(this.spec.def ?? null);
  }
}

export default EdmProperty;
