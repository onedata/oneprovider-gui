import EdmObjectType from './object-type';
import EdmProperty from './property';

// FIXME: typy obiektów mają być w enumie

/**
 * @typedef {'dc'|'dcterms'|'edm'|'owl'} EdmPropertyNamespace
 */

/**
 * @typedef {string} EdmPropertyName
 */

const allSpecs = {
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
};

/**
 * @typedef {Object} EdmPropertyClassSpec
 * @property {Array<EdmObjectType>} [objs] EDM Object types for which the Property is
 *   applicable.
 * @property {string} [attrs] Attributes of XML tag that available for the Property.
 */

/**
 * @param {EdmPropertyNamespace} namespace
 * @param {string} edmPropertyType
 * @param {EdmPropertyClassSpec} spec
 * @returns
 */
function createEdmPropertyClass(namespace, edmPropertyType, spec) {
  const options = {
    edmPropertyType,
    namespace,
  };
  if (spec.attrs) {
    options.shownAttrs = spec.attrs;
  }
  if (spec.objs) {
    options.objectTypes = spec.objs;
  }

  const newClass = class extends EdmProperty {
    shownAttrs = spec.attrs;
    objectTypes = spec.objs;
    namespace = namespace;
    edmPropertyType = edmPropertyType;
  };

  return newClass;

  // return EdmProperty.extend(options);
}

const propertyClasses = [
  'dc',
  'dcterms',
  'edm',
  'owl',
].reduce((classesPerNamespace, namespace) => {
  const namespaceSpecs = allSpecs[namespace];
  classesPerNamespace[namespace] =
    Object.entries(namespaceSpecs).reduce((namespaceClasses, [propertyName, spec]) => {
      namespaceClasses[propertyName] = createEdmPropertyClass(
        namespace,
        propertyName,
        spec
      );
      return namespaceClasses;
    }, {});
  return classesPerNamespace;
}, {});

export default propertyClasses;
