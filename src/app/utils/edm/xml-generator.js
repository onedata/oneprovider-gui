import globals from 'onedata-gui-common/utils/globals';

const EdmXmlGenerator = class EdmXmlParser {
  static namespaceUris = Object.freeze({
    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    dc: 'http://purl.org/dc/elements/1.1/',
    dcterms: 'http://purl.org/dc/terms/',
    edm: 'http://www.europeana.eu/schemas/edm/',
    ore: 'http://www.openarchives.org/ore/terms/',
  });

  static xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>';

  /**
   * @param {Utils.Edm.Metadata} edmMetadata
   */
  constructor(edmMetadata) {
    /** @type {Utils.Edm.Metadata} */
    this.edmMetadata = edmMetadata;
  }
  /** @returns {XMLDocument} */
  createXmlDocument() {
    return globals.document.implementation.createDocument(
      EdmXmlGenerator.namespaceUris.rdf,
      'rdf:RDF'
    );
  }
  /**
   * @param {HTMLElement} rootNode
   */
  addRdfNamespaces(rootNode) {
    for (const [namespace, uri] of Object.entries(EdmXmlGenerator.namespaceUris)) {
      if (namespace === 'rdf') {
        continue;
      }
      rootNode.setAttribute(`xmlns:${namespace}`, uri);
    }
  }
  generateXml() {
    const doc = this.createXmlDocument();
    const rootNode = doc.documentElement;
    this.addRdfNamespaces(rootNode);
    // FIXME: można rozbić tą generację - per Object i per Property
    for (const edmObject of this.edmMetadata.edmObjects) {
      /** @type {Element} */
      const xmlObjectElement = doc.createElement(edmObject.xmlTagName);
      if (edmObject.attrs?.about) {
        xmlObjectElement.setAttribute('rdf:about', edmObject.attrs.about);
      }
      for (const edmProperty of edmObject.edmProperties) {
        /** @type {Element} */
        const xmlPropertyElement = doc.createElement(edmProperty.xmlTagName);
        if (edmProperty.value) {
          xmlPropertyElement.textContent = edmProperty.value;
        }
        const propertyAttrEntries = Object.entries(edmProperty.getFilledAttrs(true));
        for (const [attrName, value] of propertyAttrEntries) {
          xmlPropertyElement.setAttribute(attrName, value);
        }
        xmlObjectElement.appendChild(xmlPropertyElement);
      }
      rootNode.appendChild(xmlObjectElement);
    }
    return `${EdmXmlGenerator.xmlDeclaration}\n${rootNode.outerHTML}`;
  }
};

export default EdmXmlGenerator;
