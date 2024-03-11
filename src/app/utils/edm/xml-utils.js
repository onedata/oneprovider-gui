import globals from 'onedata-gui-common/utils/globals';
import { supportedPropertyTagSet } from './property-spec';

// FIXME: refactor to have common code with enum
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
