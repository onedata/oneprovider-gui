import _ from 'lodash';
import EdmObjectType from './object-type';

const visualPropertiesOrder = [
  'dc:title',
  'dc:description',
  'edm:type',
  'dc:subject',
  'dc:type',
  'dc:contributor',
  'dc:creator',
  'dcterms:created',
  'dc:format',
  'dc:identifier',
  'dc:language',
  'dcterms:extent',
  'dcterms:isPartOf',
  'dcterms:medium',
  'dcterms:spatial',
  'edm:currentLocation',
  'edm:aggregatedCHO',
  'edm:dataProvider',
  'edm:isShownAt',
  'edm:isShownBy',
  'edm:object',
  'edm:provider',
  'edm:rights',
  'dc:rights',
  'dcterms:isFormatOf',
  'dc:relation',
];

const objectsOrder = [
  'edm:ProvidedCHO',
  'ore:Aggregation',
  'edm:WebResource',
];

/**
 * @param {Array<EdmProperty>} edmProperties
 * @param {'visual'|'xml'} mode
 * @returns {Array<EdmProperty>}
 */
export function sortProperties(edmProperties, mode) {
  switch (mode) {
    case 'visual':
      return [...edmProperties].sort(propertyComparatorVisual);
    case 'xml':
    default:
      return _.sortBy(edmProperties, 'xmlTagName');
  }

}

/**
 * @param {EdmProperty} a
 * @param {EdmProperty} b
 * @returns {Number}
 */
function propertyComparatorVisual(a, b) {
  const aTag = a.xmlTagName;
  const bTag = b.xmlTagName;
  const aIndex = visualPropertiesOrder.indexOf(aTag);
  const bIndex = visualPropertiesOrder.indexOf(bTag);
  if (aIndex === -1) {
    if (bIndex === -1) {
      return aTag.localeCompare(bTag);
    } else {
      return 1;
    }
  }
  if (bIndex === -1) {
    return -1;
  }

  return aIndex - bIndex;
}

/**
 * @param {Array<EdmObject>} edmObjects
 * @returns {Array<EdmObject>}
 */
export function sortObjects(edmObjects) {
  return [...edmObjects].sort(objectComparator);
}

/**
 * @param {EdmObject} a
 * @param {EdmObject} b
 * @returns {Number}
 */
function objectComparator(a, b) {
  const aTag = a.xmlTagName;
  const bTag = b.xmlTagName;
  const aIndex = objectsOrder.indexOf(aTag);
  const bIndex = objectsOrder.indexOf(bTag);
  if (aIndex === -1) {
    if (bIndex === -1) {
      return aTag.localeCompare(bTag);
    } else {
      return 1;
    }
  }
  if (bIndex === -1) {
    return -1;
  }

  return aIndex - bIndex;
}
