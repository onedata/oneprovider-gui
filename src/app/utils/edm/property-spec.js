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
      obj: [EdmObjectType.ProvidedCHO],
    },
    coverage: { obj: [EdmObjectType.ProvidedCHO] },
    creator: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
    },
    date: { obj: [EdmObjectType.ProvidedCHO] },
    description: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
    },
    format: {
      val: EdmPropertyValueType.Reference,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
    },
    identifier: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
    },
    language: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
    },
    publisher: { obj: [EdmObjectType.ProvidedCHO] },
    relation: {
      val: EdmPropertyValueType.Reference,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
    },
    rights: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [
        EdmObjectType.ProvidedCHO,
        EdmObjectType.Aggregation,
        EdmObjectType.WebResource,
      ],
    },
    source: { obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource] },
    subject: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
    },
    title: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
    },
    type: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
    },
  },
  dcterms: {
    alternative: { obj: [EdmObjectType.ProvidedCHO] },
    conformsTo: { obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource] },
    created: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
    },
    extent: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
    },
    hasFormat: { obj: [EdmObjectType.ProvidedCHO] },
    hasPart: { obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource] },
    hasVersion: { obj: [EdmObjectType.ProvidedCHO] },
    isFormatOf: {
      val: EdmPropertyValueType.Reference,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
    },
    isPartOf: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
    },
    isReferencedBy: { obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource] },
    isReplacedBy: { obj: [EdmObjectType.ProvidedCHO] },
    isRequiredBy: { obj: [EdmObjectType.ProvidedCHO] },
    issued: { obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource] },
    isVersionOf: { obj: [EdmObjectType.ProvidedCHO] },
    medium: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
    },
    provenance: { obj: [EdmObjectType.ProvidedCHO] },
    references: { obj: [EdmObjectType.ProvidedCHO] },
    replaces: { obj: [EdmObjectType.ProvidedCHO] },
    requires: { obj: [EdmObjectType.ProvidedCHO] },
    spatial: {
      val: EdmPropertyValueType.Reference,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
    },
    tableOfContents: { obj: [EdmObjectType.ProvidedCHO] },
    temporal: { obj: [EdmObjectType.ProvidedCHO] },
  },
  edm: {
    aggregatedCHO: {
      val: EdmPropertyValueType.Reference,
      obj: [EdmObjectType.Aggregation],
      basic: true,
    },
    // FIXME: tego nie ma w standardzie EDM, ale jest w spreadsheecie
    currentLocation: {
      val: EdmPropertyValueType.Reference,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
    },
    dataProvider: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.Aggregation],
    },
    hasMet: { obj: [EdmObjectType.ProvidedCHO] },
    hasType: { obj: [EdmObjectType.ProvidedCHO] },
    hasView: { obj: [EdmObjectType.Aggregation] },
    incorporates: { obj: [EdmObjectType.ProvidedCHO] },
    intermediateProvider: { obj: [EdmObjectType.Aggregation] },
    isDerivativeOf: { obj: [EdmObjectType.ProvidedCHO] },
    isNextInSequence: { obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource] },
    isRelatedTo: { obj: [EdmObjectType.ProvidedCHO] },
    isRepresentationOf: { obj: [EdmObjectType.ProvidedCHO] },
    isShownAt: {
      val: EdmPropertyValueType.Reference,
      basic: true,
      obj: [EdmObjectType.Aggregation],
    },
    isShownBy: { val: EdmPropertyValueType.Reference, obj: [EdmObjectType.Aggregation] },
    isSimilarTo: { obj: [EdmObjectType.ProvidedCHO] },
    isSuccessorOf: { obj: [EdmObjectType.ProvidedCHO] },
    object: {
      val: EdmPropertyValueType.Reference,
      basic: true,
      obj: [EdmObjectType.Aggregation],
    },
    // FIXME: tylko w spreasheecie
    provider: {
      val: EdmPropertyValueType.Any,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.Aggregation],
    },
    realizes: { obj: [EdmObjectType.ProvidedCHO] },
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
      obj: [EdmObjectType.Aggregation, EdmObjectType.WebResource],
    },
    type: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
    },
    ugc: { obj: [EdmObjectType.Aggregation] },
  },
  owl: {
    isSameAs: { obj: [EdmObjectType.ProvidedCHO] },
    sameAs: { obj: [EdmObjectType.WebResource] },
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
