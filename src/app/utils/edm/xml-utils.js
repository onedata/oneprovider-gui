/**
 * Utilities for working with XML source of EDM metadata.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import globals from 'onedata-gui-common/utils/globals';
import { getAllPropertyData, getSupportedPropertyTagSet } from './property-spec';
import xmlFormat from 'xml-formatter';
import { EdmObjectTagName } from './object-type';

const supportedObjectTagSet = Object.freeze(new Set(Object.values(EdmObjectTagName)));

/**
 * @typedef {Object} EdmXmlStringifyOptions
 * @param {number} tabSize
 */

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
  return xmlNode instanceof Element && getSupportedPropertyTagSet().has(xmlNode.tagName);
}

let objectSupportedPropertiesTagsCache;

export function getObjectSupportedPropertiesTags() {
  return objectSupportedPropertiesTagsCache ??= createObjectSupportedPropertiesTags();
}

export function isXmlPropertyCompatibleWithObject(propertyXmlNode, objectXmlNode) {
  const objectTag = objectXmlNode.tagName;
  const propertyTag = propertyXmlNode.tagName;
  return getObjectSupportedPropertiesTags()[objectTag].has(propertyTag);
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
 * @param {EdmXmlStringifyOptions} [options]
 * @returns {string}
 */
export function stringifyXmlDocument(xmlDocument, { tabSize } = {}) {
  const xmlSerializer = new XMLSerializer();
  const tabSpaces = ' '.repeat(tabSize ?? 4);
  let str = xmlFormat(xmlSerializer.serializeToString(xmlDocument), {
    indentation: tabSpaces,
    collapseContent: true,
    lineSeparator: '\n',
  });
  try {
    str = str.replace(/(<\?xml version="1.0" encoding="UTF-8"\?>)/, '$1\n');
    const namespaces = str.match(/<rdf:RDF\s*(.*?)\s*>\s*(\n|$)/)[1]
      .replaceAll(/(xmlns:)\s*/g, `\n${tabSpaces}$1`);
    str = str.replace(/<rdf:RDF\s*.*?\s*>/, `<rdf:RDF ${namespaces}>`);
  } catch {
    console.error('Failed to properly format EDM metadata XML');
  }
  return str;
}

function createObjectSupportedPropertiesTags() {
  const mapping = [];
  const allPropertyData = getAllPropertyData();
  for (const { xmlTagName: propertyTag, spec } of allPropertyData) {
    const objectTag = EdmObjectTagName[spec.obj];
    if (!mapping[objectTag]) {
      mapping[objectTag] = new Set();
    }
    mapping[objectTag].add(propertyTag);
  }
  return mapping;
}
