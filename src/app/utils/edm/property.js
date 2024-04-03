import EdmAttrs, { namespacedAttr } from './attrs';
import { EdmPropertyMaxOccurrences, EdmPropertyRecommendation, EdmPropertyValueType } from './property-spec';

class EdmProperty {
  static supportedXmlAttrs = Object.freeze([
    'lang',
    'resource',
  ].map(attr => namespacedAttr(attr)));

  /**
   * @param {XMLDocument} [options.xmlDocument]
   * @param {string} [options.namespace]
   * @param {string} [options.edmPropertyType]
   * @param {Element} [options.xmlElement]
   * @param {Array<string>} [options.shownAttrs]
   * @param {EdmPropertySpec} [options.spec]
   */
  constructor(options) {
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
    this.spec = options.spec;
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
