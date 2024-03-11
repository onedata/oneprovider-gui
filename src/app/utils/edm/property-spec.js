import EdmObjectType from './object-type';

// FIXME: typy obiektów mają być w enumie

/**
 * @typedef {'dc'|'dcterms'|'edm'|'owl'} EdmPropertyNamespace
 */

/**
 * @typedef {string} EdmPropertyName
 */

/**
 * @typedef {Object} EdmPropertySpec
 * @property {EdmPropertyValueType} val
 */

export const EdmPropertyValueType = Object.freeze({
  Literal: 'literal',
  Reference: 'reference',
  Any: 'any',
});

// FIXME: use
export const EdmPropertyRedommendation = Object.freeze({
  Mandatory: 'mandatory',
  Recommended: 'recommended',
  None: 'none',
});

// FIXME: use
export const EdmPropertyMaxOccurrences = Object.freeze({
  Single: '1',
  Any: 'n',
});

export const allSpecs = Object.freeze({
  dc: {
    contributor: { val: EdmPropertyValueType.Any },
    coverage: {},
    creator: { val: EdmPropertyValueType.Any },
    date: {},
    description: { val: EdmPropertyValueType.Literal },
    format: { val: EdmPropertyValueType.Reference },
    identifier: { val: EdmPropertyValueType.Literal },
    language: { val: EdmPropertyValueType.Literal },
    published: {},
    relation: { val: EdmPropertyValueType.Reference },
    rights: { val: EdmPropertyValueType.Literal },
    source: {},
    subject: { val: EdmPropertyValueType.Any },
    title: { val: EdmPropertyValueType.Literal },
    type: { val: EdmPropertyValueType.Any },
  },
  dcterms: {
    alternative: {},
    conformsTo: { objs: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource] },
    created: { val: EdmPropertyValueType.Any },
    extent: { val: EdmPropertyValueType.Any },
    hasFormat: {},
    hasPart: {},
    hasVersion: {},
    isFormatOf: { val: EdmPropertyValueType.Reference },
    isPartOf: { val: EdmPropertyValueType.Any },
    isReferencedBy: {},
    isReplacedBy: {},
    isRequiredBy: {},
    issued: {},
    isVersionOf: {},
    medium: { val: EdmPropertyValueType.Literal },
    provenance: {},
    references: {},
    replaces: {},
    requires: {},
    spatial: { val: EdmPropertyValueType.Reference },
    tableOfContents: {},
    temporal: {},
  },
  edm: {
    aggregatedCHO: {
      val: EdmPropertyValueType.Reference,
      objs: [EdmObjectType.Aggregation],
    },
    // FIXME: tego nie ma w standardzie EDM, ale jest w spreatsheecie
    currentLocation: { val: EdmPropertyValueType.Reference },
    dataProvider: {
      val: EdmPropertyValueType.Any,
      objs: [EdmObjectType.Aggregation],
    },
    hasMet: {},
    hasType: {},
    hasView: { objs: [EdmObjectType.Aggregation] },
    incorporates: {},
    intermediateProvider: { objs: [EdmObjectType.Aggregation] },
    isDerivativeOf: {},
    isNextInSequence: {},
    isRelatedTo: {},
    isRepresentationOf: {},
    isShownAt: { val: EdmPropertyValueType.Reference, objs: [EdmObjectType.Aggregation] },
    isShownBy: { val: EdmPropertyValueType.Reference, objs: [EdmObjectType.Aggregation] },
    isSimilarTo: {},
    isSuccessorOf: {},
    object: { val: EdmPropertyValueType.Reference, objs: [EdmObjectType.Aggregation] },
    // FIXME: tylko w spreasheecie
    provider: { val: EdmPropertyValueType.Any },
    realizes: {},
    rights: {
      val: EdmPropertyValueType.Reference,
      objs: [EdmObjectType.WebResource, EdmObjectType.Aggregation],
      predef: [{
          label: 'Creative Commons Attribution 4.0 International',
          value: 'https://creativecommons.org/licenses/by/4.0/',
        },
        {
          label: 'Creative Commons Attribution-ShareAlike 4.0 International',
          value: 'https://creativecommons.org/licenses/by-sa/4.0/',
        },
        {
          label: 'Creative Commons Attribution-ShareAlike 4.0 International',
          value: 'https://creativecommons.org/licenses/by-sa/4.0/',
        },
        {
          label: 'Attribution-NoDerivs 4.0 International',
          value: 'https://creativecommons.org/licenses/by-nd/4.0/',
        },
        {
          label: 'Attribution-NonCommercial 4.0 International',
          value: 'https://creativecommons.org/licenses/by-nc/4.0/',
        },
        {
          label: 'Attribution-NonCommercial-ShareAlike 4.0 International',
          value: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
        },
        {
          label: 'Attribution-NonCommercial-NoDerivs 4.0 International',
          value: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
        },
      ],
    },
    type: { val: EdmPropertyValueType.Literal },
    ugc: { objs: [EdmObjectType.Aggregation] },
  },
  owl: {
    isSameAs: { objs: [EdmObjectType.ProvidedCHO] },
    sameAs: { objs: [EdmObjectType.WebResource] },
  },
});

function createSupportedTags() {
  const array = [];
  for (const namespace of Object.keys(allSpecs)) {
    for (const propertyName of Object.keys(allSpecs[namespace])) {
      array.push(`${namespace}:${propertyName}`);
    }
  }
  return array;
}

export const supportedPropertyTagSet = Object.freeze(new Set(createSupportedTags()));
