const EdmXmlParser = class EdmXmlParser {
  /**
   * @param {string} xmlValue
   */
  constructor(xmlValue) {
    this.xmlValue = xmlValue;
    this.domParser = new DOMParser();
    /** @type {XMLDocument} */
    this.xmlDoc = this.domParser.parseFromString(this.xmlValue, 'text/xml');
    // FIXME: validacja, czy to jest rdf
    if (this.rootNode.tagName !== 'rdf:RDF') {
      throw new Error('XML has no single <rdf:RDF> root node');
    }
  }
  get rootNode() {
    return this.xmlDoc.children[0];
  }
  /** @returns {Array<Element>} */
  getObjects() {
    return Array.from(this.rootNode.children);
  }
  /**
   * @param {Element} object
   * @returns {Array<Element>}
   */
  getObjectProperties(object) {
    return object.children;
  }
};

export default EdmXmlParser;
