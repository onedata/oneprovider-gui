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
 * @property {boolean} basic If true, then the property should be available to select to
 *   be added in the visual editor.
 */

export const EdmPropertyValueType = Object.freeze({
  Literal: 'literal',
  Reference: 'reference',
  Any: 'any',
});

// FIXME: use
export const EdmPropertyRecommendation = Object.freeze({
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
    contributor: {
      val: EdmPropertyValueType.Any,
      basic: true,
      rec: EdmPropertyRecommendation.Recommended,
      max: EdmPropertyMaxOccurrences.Any,
    },
    coverage: {},
    creator: { val: EdmPropertyValueType.Any, basic: true },
    date: {},
    description: { val: EdmPropertyValueType.Literal, basic: true },
    format: { val: EdmPropertyValueType.Reference, basic: true },
    identifier: { val: EdmPropertyValueType.Literal, basic: true },
    language: { val: EdmPropertyValueType.Literal, basic: true },
    published: {},
    relation: { val: EdmPropertyValueType.Reference, basic: true },
    rights: { val: EdmPropertyValueType.Literal, basic: true },
    source: {},
    subject: { val: EdmPropertyValueType.Any, basic: true },
    title: { val: EdmPropertyValueType.Literal, basic: true },
    type: { val: EdmPropertyValueType.Any, basic: true },
  },
  dcterms: {
    alternative: {},
    conformsTo: {},
    created: { val: EdmPropertyValueType.Any, basic: true },
    extent: { val: EdmPropertyValueType.Any, basic: true },
    hasFormat: {},
    hasPart: {},
    hasVersion: {},
    isFormatOf: { val: EdmPropertyValueType.Reference, basic: true },
    isPartOf: { val: EdmPropertyValueType.Any, basic: true },
    isReferencedBy: {},
    isReplacedBy: {},
    isRequiredBy: {},
    issued: {},
    isVersionOf: {},
    medium: { val: EdmPropertyValueType.Literal, basic: true },
    provenance: {},
    references: {},
    replaces: {},
    requires: {},
    spatial: { val: EdmPropertyValueType.Reference, basic: true },
    tableOfContents: {},
    temporal: {},
  },
  edm: {
    aggregatedCHO: {
      val: EdmPropertyValueType.Reference,
      objs: [EdmObjectType.Aggregation],
      basic: true,
    },
    // FIXME: tego nie ma w standardzie EDM, ale jest w spreatsheecie
    currentLocation: { val: EdmPropertyValueType.Reference, basic: true },
    dataProvider: { val: EdmPropertyValueType.Any, basic: true },
    hasMet: {},
    hasType: {},
    hasView: {},
    incorporates: {},
    intermediateProvider: {},
    isDerivativeOf: {},
    isNextInSequence: {},
    isRelatedTo: {},
    isRepresentationOf: {},
    isShownAt: { val: EdmPropertyValueType.Reference, basic: true },
    isShownBy: { val: EdmPropertyValueType.Reference },
    isSimilarTo: {},
    isSuccessorOf: {},
    object: { val: EdmPropertyValueType.Reference, basic: true },
    // FIXME: tylko w spreasheecie
    provider: { val: EdmPropertyValueType.Any },
    realizes: {},
    rights: {
      basic: true,
      val: EdmPropertyValueType.Reference,
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
    type: { val: EdmPropertyValueType.Literal, basic: true },
    ugc: {},
  },
  owl: {
    isSameAs: {},
    sameAs: {},
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
