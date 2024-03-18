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
 * @property {Array} obj
 * @property {EdmPropertyRecommendation} rec
 * @property {EdmPropertyMaxOccurrences} max
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

const Rec = EdmPropertyRecommendation;
const Max = EdmPropertyMaxOccurrences;

export const allSpecs = Object.freeze({
  dc: {
    contributor: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      rec: Rec.Recommended,
      max: Max.Any,
    },
    coverage: { obj: [EdmObjectType.ProvidedCHO] },
    creator: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
      rec: Rec.Recommended,
      max: Max.Any,
    },
    date: { obj: [EdmObjectType.ProvidedCHO] },
    description: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
      rec: Rec.Mandatory,
      max: Max.Single,
    },
    format: {
      val: EdmPropertyValueType.Reference,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
      // FIXME: sprawdzić w spreadsheecie
      rec: Rec.Mandatory,
      max: Max.Single,
    },
    identifier: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      rec: Rec.None,
      max: Max.Single,
    },
    language: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      rec: Rec.Mandatory,
      max: Max.Any,
    },
    publisher: { obj: [EdmObjectType.ProvidedCHO] },
    relation: {
      val: EdmPropertyValueType.Reference,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      rec: Rec.None,
      max: Max.Any,
    },
    rights: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [
        EdmObjectType.ProvidedCHO,
        EdmObjectType.Aggregation,
        EdmObjectType.WebResource,
      ],
      rec: Rec.None,
      max: Max.Any,
    },
    source: { obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource] },
    subject: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      rec: Rec.Mandatory,
      max: Max.Single,
    },
    title: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      rec: Rec.Mandatory,
      max: Max.Single,
    },
    type: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
      rec: Rec.Mandatory,
      max: Max.Single,
    },
  },
  dcterms: {
    alternative: { obj: [EdmObjectType.ProvidedCHO] },
    conformsTo: { obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource] },
    created: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
      rec: Rec.Recommended,
      max: {
        [EdmObjectType.ProvidedCHO]: Max.Any,
        [EdmObjectType.WebResource]: Max.Single,
      },
    },
    extent: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
      rec: Rec.None,
      max: Max.Any,
    },
    hasFormat: { obj: [EdmObjectType.ProvidedCHO] },
    hasPart: { obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource] },
    hasVersion: { obj: [EdmObjectType.ProvidedCHO] },
    isFormatOf: {
      val: EdmPropertyValueType.Reference,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
      rec: Rec.None,
      max: Max.Any,
    },
    isPartOf: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
      rec: Rec.None,
      max: Max.Any,
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
      rec: Rec.None,
      max: Max.Any,
    },
    provenance: { obj: [EdmObjectType.ProvidedCHO] },
    references: { obj: [EdmObjectType.ProvidedCHO] },
    replaces: { obj: [EdmObjectType.ProvidedCHO] },
    requires: { obj: [EdmObjectType.ProvidedCHO] },
    spatial: {
      val: EdmPropertyValueType.Reference,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      rec: Rec.None,
      max: Max.Any,
    },
    tableOfContents: { obj: [EdmObjectType.ProvidedCHO] },
    temporal: { obj: [EdmObjectType.ProvidedCHO] },
  },
  edm: {
    aggregatedCHO: {
      val: EdmPropertyValueType.Reference,
      basic: true,
      obj: [EdmObjectType.Aggregation],
      rec: Rec.Mandatory,
      max: Max.Single,
    },
    // FIXME: tego nie ma w standardzie EDM, ale jest w spreadsheecie
    currentLocation: {
      val: EdmPropertyValueType.Reference,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      rec: Rec.None,
      max: Max.Single,
    },
    dataProvider: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.Aggregation],
      rec: Rec.Mandatory,
      max: Max.Single,
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
      rec: Rec.None,
      max: Max.Any,
    },
    isShownBy: {
      val: EdmPropertyValueType.Reference,
      obj: [EdmObjectType.Aggregation],
      rec: Rec.Mandatory,
      max: Max.Single,
    },
    isSimilarTo: { obj: [EdmObjectType.ProvidedCHO] },
    isSuccessorOf: { obj: [EdmObjectType.ProvidedCHO] },
    object: {
      val: EdmPropertyValueType.Reference,
      basic: true,
      obj: [EdmObjectType.Aggregation],
      rec: Rec.Recommended,
      max: Max.Single,
    },
    // FIXME: tylko w spreasheecie - ma być dropdown i wypełnione
    provider: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.Aggregation],
      rec: Rec.Mandatory,
      max: Max.Single,
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
      rec: Rec.Mandatory,
      max: Max.Single,
    },
    type: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      rec: Rec.Mandatory,
      max: Max.Single,
    },
    ugc: { obj: [EdmObjectType.Aggregation] },
  },
  owl: {
    isSameAs: { obj: [EdmObjectType.ProvidedCHO] },
    sameAs: { obj: [EdmObjectType.WebResource] },
  },
});

// FIXME: raczej powinno się zrobić speki w płaskiej liście i ew. potem robić z tego mapę pomocniczną (grupowaną)

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

function createFlatSpecs() {
  const items = [];
  for (const [namespace, namespaceSpecs] of Object.entries(allSpecs)) {
    for (const [name, spec] of Object.entries(namespaceSpecs)) {
      items.push(Object.freeze({
        name,
        namespace,
        xmlTagName: `${namespace}:${name}`,
        spec,
      }));
    }
  }
  return items;
}

export const flatSpecs = createFlatSpecs();
