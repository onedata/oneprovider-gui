const propertiesOrder = [
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

/**
 * @param {Array<EdmProperty>} edmProperties
 * @returns {Array<EdmProperty>}
 */
export function sortProperties(edmProperties) {
  return [...edmProperties].sort(propertyComparator);
}

/**
 * @param {EdmProperty} a
 * @param {EdmProperty} b
 * @returns {Number}
 */
function propertyComparator(a, b) {
  const aTag = a.xmlTagName;
  const bTag = b.xmlTagName;
  const aIndex = propertiesOrder.indexOf(aTag);
  const bIndex = propertiesOrder.indexOf(bTag);
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
