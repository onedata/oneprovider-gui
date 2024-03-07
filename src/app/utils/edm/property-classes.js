import EdmObjectType from './object-type';
import EdmProperty from './property';

// FIXME: typy obiektów mają być w enumie

/**
 * @typedef {'dc'|'dcterms'|'edm'|'owl'} EdmPropertyNamespace
 */

/**
 * @typedef {string} EdmPropertyName
 */

export const allSpecs = Object.freeze({
  dc: {
    contributor: {},
    coverage: {},
    creator: {},
    date: {},
    description: {},
    format: {},
    identifier: {},
    language: {},
    published: {},
    relation: {},
    rights: {},
    source: {},
    subject: {},
    title: {},
    type: {},
  },
  dcterms: {
    alternative: {},
    conformsTo: { objs: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource] },
    created: {},
    extent: {},
    hasFormat: {},
    hasPart: {},
    hasVersion: {},
    isFormatOf: {},
    isPartOf: {},
    isReferencedBy: {},
    isReplacedBy: {},
    isRequiredBy: {},
    issued: {},
    isVersionOf: {},
    medium: {},
    provenance: {},
    references: {},
    replaces: {},
    requires: {},
    spatial: {},
    tableOfContents: {},
    temporal: {},
  },
  edm: {
    aggregatedCHO: { objs: [EdmObjectType.Aggregation] },
    dataProvider: { objs: [EdmObjectType.Aggregation] },
    hasMet: {},
    hasType: {},
    hasView: { objs: [EdmObjectType.Aggregation] },
    incorporates: {},
    intermediateProvider: { objs: [EdmObjectType.Aggregation] },
    isDerivativeOf: {},
    isNextInSequence: {},
    isRelatedTo: {},
    isRepresentationOf: {},
    isShownAt: { objs: [EdmObjectType.Aggregation] },
    isShownBy: { objs: [EdmObjectType.Aggregation] },
    isSimilarTo: {},
    isSuccessorOf: {},
    object: { objs: [EdmObjectType.Aggregation] },
    realizes: {},
    rights: { objs: [EdmObjectType.WebResource, EdmObjectType.Aggregation] },
    type: {},
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
