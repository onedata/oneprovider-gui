/**
 * Produces `EdmMetadata` instances from provided data or raw XML string value.
 * Currently all methods of this class are static, so it should be used like a namespace.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EdmMetadata from './metadata';
import EdmObjectType from './object-type';
import EdmObjectFactory from './object-factory';

/**
 * @typedef {Object} EdmPropertyOptions
 * @property {string} [value] Value of element.
 * @property {string} [resource] `rdf:resource` attribute of element.
 * @property {string} [lang] `xml:lang` attribute of element.
 * @property {string} [about] `rdf:about` attribute of element.
 */

export default class EdmMetadataFactory {
  /**
   * @public
   * @param {string} xmlValue
   * @returns {EdmMetadata}
   */
  static fromXml(xmlValue) {
    const domParser = new DOMParser();
    /** @type {XMLDocument} */
    let xmlDocument;
    try {
      xmlDocument = domParser.parseFromString(xmlValue, 'text/xml');
    } catch {
      throw new InvalidEdmMetadataXmlDocument();
    }
    if (!EdmMetadataFactory.validateXmlDocument(xmlDocument)) {
      throw new InvalidEdmMetadataXmlDocument();
    }
    return new EdmMetadata(xmlDocument);
  }

  static createEmptyMetadata() {
    return new EdmMetadata();
  }

  /**
   * @returns {EdmMetadata}
   */
  static createInitialMetadata() {
    const metadata = EdmMetadataFactory.createEmptyMetadata();
    const objectFactory = new EdmObjectFactory(metadata);
    metadata.edmObjects = [
      objectFactory.createInitialObject(EdmObjectType.ProvidedCHO),
      objectFactory.createInitialObject(EdmObjectType.Aggregation),
    ];

    const comment =
      'EDM XML metadata; refer to: https://pro.europeana.eu/page/edm-documentation';
    metadata.xmlDocument.insertBefore(
      metadata.xmlDocument.createComment(` ${comment} `),
      metadata.xmlElement
    );

    return metadata;
  }

  static validateXmlDocument(xmlDocument) {
    if (
      xmlDocument.children.length !== 1 ||
      xmlDocument.children[0]?.tagName !== 'rdf:RDF' ||
      findParserErrorElement(xmlDocument)
    ) {
      return false;
    }
    return true;
  }
}

function findParserErrorElement(element) {
  const childrenToCheck = [];
  for (const child of element.children) {
    if (child.tagName === 'parsererror') {
      return child;
    } else {
      childrenToCheck.push(child);
    }
  }
  for (const child of childrenToCheck) {
    return findParserErrorElement(child);
  }
}

export class InvalidEdmMetadataXmlDocument extends Error {}
