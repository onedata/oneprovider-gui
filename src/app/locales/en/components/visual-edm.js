import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';

const hasExtraData = 'Additional data in the XML source';
const hasExtraDataTip =
  'There are extra metadata elements in the XML source that are not recognized by the Onedata\'s Europeana Data Model editor/viewer. Review your XML source.';

export default {
  hasExtraData,
  hasExtraDataTip,
  object: {
    hasExtraData,
    hasExtraDataTip,
    objectTypeName: {
      [EdmObjectType.Aggregation]: 'Aggregation',
      [EdmObjectType.ProvidedCHO]: 'Provided Cultural Hertiage Object',
      [EdmObjectType.WebResource]: 'Web Resource',
    },
  },
  property: {
    hasExtraData,
    hasExtraDataTip,
  },
};
