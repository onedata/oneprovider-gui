import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';

export const objectTypeName = Object.freeze({
  [EdmObjectType.Aggregation]: 'Aggregation',
  [EdmObjectType.ProvidedCHO]: 'Provided Cultural Heritage Object',
  [EdmObjectType.WebResource]: 'Web Resource',
});

export default {
  objectTypeName,
  listButtons: {
    addProperty: 'Add property',
  },
  deleteObjectTip: 'Delete this {{objectType}}',
  object: 'object',
  notValid: 'Definition of this {{objectType}} is not valid',
};
