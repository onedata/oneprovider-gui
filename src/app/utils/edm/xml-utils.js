import globals from 'onedata-gui-common/utils/globals';
import { supportedPropertyTagSet } from './property-spec';
import xmlFormat from 'xml-formatter';

const supportedObjectTagSet = Object.freeze(new Set([
  'ore:Aggregation',
  'edm:ProvidedCHO',
  'edm:WebResource',
]));

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
