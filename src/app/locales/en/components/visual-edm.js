import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';
import property from './visual-edm/property';

export default {
  // FIXME: do osobnego pliku
  object: {
    objectTypeName: {
      [EdmObjectType.Aggregation]: 'Aggregation',
      [EdmObjectType.ProvidedCHO]: 'Provided Cultural Heritage Object',
      [EdmObjectType.WebResource]: 'Web Resource',
    },
  },
  extraDataInfo: {
    hasExtraData: 'Additional data in the XML source',
    hasExtraDataTip: 'There are extra elements in the XML source that are not recognized by the Onedata\'s Europeana Data Model editor/viewer. Review your XML source.',
  },
  property,
};
