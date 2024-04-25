// Known, but non-customly translated properties are commented-out — their labels should
// be auto-generated.

import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';
import { EdmPropertyValueType } from 'oneprovider-gui/utils/edm/property-spec';
import { EdmPropertyRecommendation } from 'oneprovider-gui/utils/edm/property-spec';

// TODO: VFS-11952 Add property hints when they will be available in the EU3D spreadsheet
// and implement this in property specs

export const propertyName = {
  dc: {
    contributor: 'Contributor to the creation of the original object',
    // coverage: '',
    creator: {
      [EdmObjectType.ProvidedCHO]: 'Creator of the model',
      [EdmObjectType.WebResource]: 'Creator of the original object',
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
    type: {
      [EdmObjectType.ProvidedCHO]: 'Type of object',
      [EdmObjectType.WebResource]: 'Type',
    },
  },
  dcterms: {
    // alternative: '',
    // conformsTo: '',
    created: {
      [EdmObjectType.ProvidedCHO]: 'Creation date of the original object',
      [EdmObjectType.WebResource]: 'Digitisation date',
    },
    extent: {
      [EdmObjectType.ProvidedCHO]: 'Dimensions with units',
      [EdmObjectType.WebResource]: 'Size of file',
    },
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
    provider: 'Name of organisation uploading the data',
    // realizes: '',
    rights: {
      // TODO: VFS-11952 According to the official docs, this should be present
      // in the Aggregation object, but in the EU3D it appears in the CHO
      [EdmObjectType.Aggregation]: 'Copyright licence URL of the original object',
      [EdmObjectType.WebResource]: 'Copyright licence URL of the digital object',
    },
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
  deletePropertyTip: 'Delete this property value',
  cannotDeleteOnlyMandatory: 'Cannot delete the only value of mandatory property',
  propertyName,
  attrName: {
    lang: 'Language',
    resource: 'Reference',
  },
  recommendation: {
    [EdmPropertyRecommendation.None]: 'optional',
    [EdmPropertyRecommendation.Mandatory]: 'mandatory',
  },
  example: '<strong>Example:</strong> {{exampleValue}}',
};
