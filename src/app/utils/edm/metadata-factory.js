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

    const comments = [
      'Example EDM XML content - replace it with the detailed metadata.',
      'Refer to the documentation of EDM at the following links:',
      'https://pro.europeana.eu/page/edm-documentation',
      'https://europeana.atlassian.net/wiki/spaces/EF/pages/2165440526/Namespaces',
      'https://europeana.atlassian.net/wiki/spaces/EF/pages/987791389/EDM+-+Mapping+guidelines',
      'https://europeana.atlassian.net/wiki/spaces/EF/pages/1969258498/Metadata+Tier+A',
      'https://pro.europeana.eu/files/Europeana_Professional/Share_your_data/Technical_requirements/EDM_Documentation/EDM_Definition_v5.2.8_102017.pdf',
    ];
    for (const comment of comments) {
      metadata.xmlDocument.insertBefore(
        metadata.xmlDocument.createComment(` ${comment} `),
        metadata.xmlElement
      );
    }

    return metadata;
  }

  static validateXmlDocument(xmlDocument) {
    if (xmlDocument.children[0]?.tagName !== 'rdf:RDF') {
      return false;
    }
    return true;
  }
}

export class InvalidEdmMetadataXmlDocument extends Error {}
