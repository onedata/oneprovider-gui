import EdmXmlGenerator from './xml-generator';
import globals from 'onedata-gui-common/utils/globals';
import EdmObjectsList from './objects-list';
import { isEmptyXmlNode, isSupportedXmlObject } from './xml-utils';

export default class EdmMetadata {
  static namespaceUris = Object.freeze({
    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    dc: 'http://purl.org/dc/elements/1.1/',
    dcterms: 'http://purl.org/dc/terms/',
    edm: 'http://www.europeana.eu/schemas/edm/',
    ore: 'http://www.openarchives.org/ore/terms/',
  });

  /**
   * @public
   * @param {string} xmlValue
   * @returns {EdmMetadata}
   */
  static fromXml(xmlValue) {
    const domParser = new DOMParser();
    /** @type {XMLDocument} */
    const xmlDocument = domParser.parseFromString(xmlValue, 'text/xml');
    return new EdmMetadata(xmlDocument);
  }

  /** @returns {XMLDocument} */
  static createXmlDocument() {
    const xmlDocument = globals.document.implementation.createDocument(
      EdmMetadata.namespaceUris.rdf,
      'rdf:RDF'
    );
    const xmlDeclaration = xmlDocument.createProcessingInstruction(
      'xml',
      'version="1.0" encoding="UTF-8"'
    );
    xmlDocument.insertBefore(xmlDeclaration, xmlDocument.firstChild);
    return xmlDocument;
  }

  /**
   * @param {Element} rootNode
   */
  static addRdfNamespaces(rootNode) {
    for (const [namespace, uri] of Object.entries(EdmXmlGenerator.namespaceUris)) {
      if (namespace === 'rdf') {
        continue;
      }
      rootNode.setAttribute(`xmlns:${namespace}`, uri);
    }
  }

  /**
   * @param {XMLDocument} xmlDocument
   */
  constructor(xmlDocument) {
    if (xmlDocument) {
      this.xmlDocument = xmlDocument;
      // FIXME: jakaś podstawowa walidacja jak w xml-parser?
    } else {
      this.xmlDocument = EdmMetadata.createXmlDocument();
      EdmMetadata.addRdfNamespaces(this.xmlElement);
    }
    /** @type {Array<EdmObject>} */
    this.edmObjects = undefined;
  }

  get xmlElement() {
    return this.xmlDocument.documentElement;
  }

  /** @param {Array<EdmObject>} */
  set edmObjects(objects) {
    this.__edmObjects = new EdmObjectsList(this.xmlElement, objects);
  }
  get edmObjects() {
    return this.__edmObjects.toArray();
  }

  stringify() {
    const xmlSerializer = new XMLSerializer();
    return xmlSerializer.serializeToString(this.xmlDocument);
  }

  get hasExtraData() {
    // FIXME: sprawdzić także to co jest poza root elementem
    for (const node of this.xmlElement.childNodes) {
      if (!isEmptyXmlNode(node) && !isSupportedXmlObject(node)) {
        return true;
      }
    }
    return false;
  }
}
