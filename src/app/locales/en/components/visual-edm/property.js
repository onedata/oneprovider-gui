// Known, but non-customly translated properties are commented-out — their labels should
// be auto-generated.

import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';
import {
  EdmPropertyValueType,
  EdmPropertyRecommendation,
} from 'oneprovider-gui/utils/edm/property-spec';

export const propertyName = {
  dc: {
    contributor: 'Contributor to the creation of the original object',
    creator: {
      [EdmObjectType.ProvidedCHO]: 'Creator of the original object',
      [EdmObjectType.WebResource]: 'Creator of the model',
    },
    description: {
      [EdmObjectType.ProvidedCHO]: 'Description/Caption',
      [EdmObjectType.WebResource]: 'Description of digital object',
    },
    format: '3D format',
    identifier: 'Internal ID',
    language: 'Language of inscriptions in the object',
    rights: 'Additional copyright information',
    subject: 'Subject',
    title: 'Title',
    type: {
      [EdmObjectType.ProvidedCHO]: 'Type of object',
      [EdmObjectType.WebResource]: 'Type of digital object',
    },
  },
  dcterms: {
    created: {
      [EdmObjectType.ProvidedCHO]: 'Creation date of the original object',
      [EdmObjectType.WebResource]: 'Digitisation date',
    },
    extent: {
      [EdmObjectType.ProvidedCHO]: 'Dimensions with units',
      [EdmObjectType.WebResource]: 'File size',
    },
    isFormatOf: 'URL for raw data',
    isPartOf: 'Parent entity (collection, object, site…)',
    isReferencedBy: 'URL for paradata',
    medium: 'Material',
    spatial: 'Original location',
  },
  edm: {
    aggregatedCHO: 'Aggregated CHO',
    currentLocation: 'Current location',
    dataProvider: 'Content provider institution',
    isShownAt: 'Object on provider\'s Website',
    object: 'Representative image',
    provider: 'Name of organisation uploading the data',
    rights: 'Copyright licence URL of the digital object',
    type: 'Category',
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
  unknownDropdownOption: 'Unknown',
  validUnknownDropdownOption: 'Supplementary',
  examplePlaceholder: 'Example: {{exampleValue}}',
};
