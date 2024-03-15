import property from './visual-edm/property';
import object from './visual-edm/object';
import addPropertySelector from './visual-edm/add-property-selector';

export default {
  listButtons: {
    addWebResource: 'Add Web Resource',
  },
  // FIXME: do osobnego pliku
  object,
  extraDataInfo: {
    hasExtraData: 'Additional data in the XML source',
    hasExtraDataTip: 'There are extra elements in the XML source that are not recognized by the Onedata\'s Europeana Data Model editor/viewer. Review your XML source.',
  },
  addPropertySelector,
  property,
};
