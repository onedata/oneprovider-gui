import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';
import property from './visual-edm/property';
import addPropertySelector from './visual-edm/add-property-selector';

export default {
  listButtons: {
    addWebResource: 'Add Web Resource',
  },
  // FIXME: do osobnego pliku
  object: {
    objectTypeName: {
      [EdmObjectType.Aggregation]: 'Aggregation',
      [EdmObjectType.ProvidedCHO]: 'Provided Cultural Heritage Object',
      [EdmObjectType.WebResource]: 'Web Resource',
    },
    listButtons: {
      addProperty: 'Add property',
    },
  },
  extraDataInfo: {
    hasExtraData: 'Additional data in the XML source',
    hasExtraDataTip: 'There are extra elements in the XML source that are not recognized by the Onedata\'s Europeana Data Model editor/viewer. Review your XML source.',
  },
  addPropertySelector,
  property,
};
