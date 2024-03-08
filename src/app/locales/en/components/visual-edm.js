import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';

export default {
  object: {
    objectTypeName: {
      [EdmObjectType.Aggregation]: 'Aggregation',
      [EdmObjectType.ProvidedCHO]: 'Provided Cultural Hertiage Object',
      [EdmObjectType.WebResource]: 'Web Resource',
    },
  },
  property: {},
  extraDataInfo: {
    hasExtraData: 'Additional data in the XML source',
    hasExtraDataTip: 'There are extra elements in the XML source that are not recognized by the Onedata\'s Europeana Data Model editor/viewer. Review your XML source.',
  },
};
