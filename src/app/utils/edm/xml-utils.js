/**
 * Utilities for working with XML source of EDM metadata.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import globals from 'onedata-gui-common/utils/globals';
import { allPropertyData, supportedPropertyTagSet } from './property-spec';
import xmlFormat from 'xml-formatter';
import { EdmObjectTagName } from './object-type';

const supportedObjectTagSet = Object.freeze(new Set(Object.values(EdmObjectTagName)));

/**
 * @param {Node} xmlNode
 * @returns {boolean}
 */
export function isSupportedXmlObject(xmlNode) {
  return xmlNode instanceof Element && supportedObjectTagSet.has(xmlNode.tagName);
}

/**
 * @param {Node} xmlNode
 * @returns {boolean}
 */
export function isSupportedXmlProperty(xmlNode) {
  return xmlNode instanceof Element && supportedPropertyTagSet.has(xmlNode.tagName);
}

export const objectSupportedPropertiesTags = createObjectSupportedPropertiesTags();

export function isXmlPropertyCompatibleWithObject(propertyXmlNode, objectXmlNode) {
  const objectTag = objectXmlNode.tagName;
  const propertyTag = propertyXmlNode.tagName;
  return objectSupportedPropertiesTags[objectTag].has(propertyTag);
}

/**
 * @param {Node} xmlNode
 * @returns {boolean}
 */
export function isEmptyXmlNode(xmlNode) {
  return xmlNode.nodeType === globals.window.Node.TEXT_NODE && !xmlNode.nodeValue?.trim();
}

/**
 * @param {XMLDocument} xmlDocument
 * @returns {string}
 */
export function stringifyXmlDocument(xmlDocument) {
  const xmlSerializer = new XMLSerializer();
  let str = xmlFormat(xmlSerializer.serializeToString(xmlDocument), {
    indentation: '  ',
    collapseContent: true,
  });
  try {
    str = str.replace(/(<\?xml version="1.0" encoding="UTF-8"\?>)/, '$1\n');
    const namespaces = str.match(/<rdf:RDF\s*(.*?)\s*>\s*(\n|$)/)[1]
      .replaceAll(/(xmlns:)\s*/g, '\n  $1');
    str = str.replace(/<rdf:RDF\s*.*?\s*>/, `<rdf:RDF ${namespaces}>`);
  } catch {
    console.error('Failed to properly format EDM metadata XML');
  }
  return str;
}

function createObjectSupportedPropertiesTags() {
  const mapping = [];
  for (const { xmlTagName: propertyTag, spec } of allPropertyData) {
    for (const edmObjectType of spec.obj) {
      const objectTag = EdmObjectTagName[edmObjectType];
      if (!mapping[objectTag]) {
        mapping[objectTag] = new Set();
      }
      mapping[objectTag].add(propertyTag);
    }
  }
  return mapping;
}
