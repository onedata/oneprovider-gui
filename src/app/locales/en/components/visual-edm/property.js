// Known, but non-customly translated properties are commented-out — their labels should
// be auto-generated.

import { EdmPropertyValueType } from 'oneprovider-gui/utils/edm/property-spec';
import { EdmPropertyRecommendation } from 'oneprovider-gui/utils/edm/property-spec';

export const propertyName = {
  dc: {
    contributor: 'Contributor to the creation of the original object',
    // coverage: '',
    creator: {
      ProvidedCHO: 'Creator of the model',
      WebResource: 'Creator of the original object',
    },
    // date: '',
    description: 'Description',
    format: '3D format',
    identifier: 'Internal ID',
    language: 'Language of inscriptions in the object',
    // publisher: '',
    relation: 'URL for paradata',
    rights: 'Copyright',
    // source: '',
    subject: 'Subject',
    title: 'Title',
    type: 'Type of object',
  },
  dcterms: {
    // alternative: '',
    // conformsTo: '',
    created: {
      ProvidedCHO: 'Creation date of the original object',
      WebResource: 'Digitisation date',
    },
    extent: 'Dimensions with units',
    // hasFormat: '',
    // hasPart: '',
    // hasVersion: '',
    isFormatOf: 'URL for raw data',
    isPartOf: 'Parent entity (collection, object, site…)',
    // isReferencedBy: '',
    // isReplacedBy: '',
    // isRequiredBy: '',
    // issued: '',
    // isVersionOf: '',
    medium: 'Material',
    // provenance: '',
    // references: '',
    // replaces: '',
    // requires: '',
    spatial: 'Original location',
    // tableOfContents: '',
    // temporal: '',
  },
  edm: {
    aggregatedCHO: 'Aggregated CHO',
    currentLocation: 'Current location',
    dataProvider: 'Content provider institution',
    // hasMet: '',
    // hasType: '',
    // hasView: '',
    // incorporates: '',
    // intermediateProvider: '',
    // isDerivativeOf: '',
    // isNextInSequence: '',
    // isRelatedTo: '',
    // isRepresentationOf: '',
    isShownAt: 'Object on provider\'s Website',
    // isShownBy: '',
    // isSimilarTo: '',
    // isSuccessorOf: '',
    object: 'Representative image',
    // realizes: '',
    rights: 'Copyright licence URL of the original object',
    type: 'Asset type',
    // ugc: '',
  },
  owl: {
    // isSameAs: '',
    // sameAs: '',
  },
};

export default {
  valueType: {
    literal: 'Literal value',
    reference: 'Reference',
  },
  valueLabel: {
    [EdmPropertyValueType.Literal]: 'Value',
    [EdmPropertyValueType.Reference]: 'Reference',
  },
  language: 'Language',
  defaultLanguage: 'using default',
  deletePropertyTip: 'Delete this property value',
  cannotDeleteOnlyMandatory: 'Cannot delete the only value of mandatory property',
  propertyName,
  attrName: {
    lang: 'Language',
    resource: 'Reference',
  },
  recommendation: {
    [EdmPropertyRecommendation.None]: 'optional',
    [EdmPropertyRecommendation.Recommended]: 'recommended',
    [EdmPropertyRecommendation.Mandatory]: 'mandatory',
  },
};
