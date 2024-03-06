import EdmAttrs from './attrs';

class EdmProperty {
  static defaultShownAttrs = Object.freeze(['resource', 'lang', 'about']);

  /**
   * @param {XMLDocument} [options.xmlDocument]
   * @param {string} [options.namespace]
   * @param {string} [options.edmPropertyType]
   * @param {Element} [options.xmlElement]
   * @param {boolean} [options.hasExtraData]
   * @param {Array<string>} [options.shownAttrs]
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
    this.hasExtraData = options.hasExtraData || false;
    this.shownAttrs = options.shownAttrs || EdmProperty.defaultShownAttrs;
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

  // FIXME: implement?
  // getFilledAttrs
}

export default EdmProperty;
