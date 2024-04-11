import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';

export default {
  objectTypeName: {
    [EdmObjectType.Aggregation]: 'Aggregation',
    [EdmObjectType.ProvidedCHO]: 'Provided Cultural Heritage Object',
    [EdmObjectType.WebResource]: 'Web Resource',
  },
  listButtons: {
    addProperty: 'Add property',
  },
  deleteObjectTip: 'Delete this {{objectType}}',
  object: 'object',
  notValid: 'Definition of this {{objectType}} is not valid',
};
