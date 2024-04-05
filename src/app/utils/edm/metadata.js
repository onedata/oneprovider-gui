/**
 * Model of EDM metadata backed by EDM metadata XML document.
 * Contains list of EDM objects - see `EdmObject` class.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import globals from 'onedata-gui-common/utils/globals';
import EdmObjectsList from './objects-list';
import { isEmptyXmlNode, isSupportedXmlObject, stringifyXmlDocument } from './xml-utils';
import { sortObjects } from './sort';

export default class EdmMetadata {
  static namespaceUris = Object.freeze({
    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    dc: 'http://purl.org/dc/elements/1.1/',
    dcterms: 'http://purl.org/dc/terms/',
    edm: 'http://www.europeana.eu/schemas/edm/',
    ore: 'http://www.openarchives.org/ore/terms/',
  });

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
    for (const [namespace, uri] of Object.entries(EdmMetadata.namespaceUris)) {
      if (namespace === 'rdf') {
        continue;
      }
      rootNode.setAttribute(`xmlns:${namespace}`, uri);
    }
  }

  /** @type {EdmObjectsList} */
  #edmObjectsList = undefined;
  /** @type {Array<EdmObject>} */
  #edmObjects = undefined;
  /** @type {XMLDocument} */
  #xmlDocument = undefined;

  /**
   * @param {XMLDocument} xmlDocument
   */
  constructor(xmlDocument) {
    if (xmlDocument) {
      this.#xmlDocument = xmlDocument;
    } else {
      this.#xmlDocument = EdmMetadata.createXmlDocument();
      EdmMetadata.addRdfNamespaces(this.xmlElement);
    }
    /** @type {Array<EdmObject>} */
    this.edmObjects = undefined;
  }

  get xmlDocument() {
    return this.#xmlDocument;
  }

  get xmlElement() {
    return this.xmlDocument.documentElement;
  }

  /** @param {Array<EdmObject>} */
  set edmObjects(objects) {
    this.#edmObjectsList = new EdmObjectsList(this.xmlElement, objects);
    this.#edmObjects = this.#edmObjectsList.toArray();
  }

  get edmObjects() {
    return this.#edmObjects;
  }

  get hasExtraData() {
    for (const node of this.xmlElement.childNodes) {
      if (!isEmptyXmlNode(node) && !isSupportedXmlObject(node)) {
        return true;
      }
    }
    return false;
  }

  addObject(edmObject) {
    this.#edmObjectsList.addObject(edmObject);
    this.#edmObjects = this.#edmObjectsList.toArray();
  }

  deleteObject(edmObject) {
    this.#edmObjectsList.deleteObject(edmObject);
    this.#edmObjects = this.#edmObjectsList.toArray();
  }

  stringify() {
    return stringifyXmlDocument(this.xmlDocument);
  }

  sort() {
    this.#edmObjectsList.replaceAll(sortObjects(this.edmObjects));
    for (const object of this.edmObjects) {
      object.sortProperties();
    }
  }
}
