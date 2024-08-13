import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';

export const objectTypeName = Object.freeze({
  [EdmObjectType.Aggregation]: 'Aggregation',
  [EdmObjectType.ProvidedCHO]: 'Cultural Heritage Object',
  [EdmObjectType.WebResource]: 'Digital Object',
});

export default {
  objectTypeName,
  listButtons: {
    addProperty: 'Add property',
  },
  deleteObjectTip: 'Delete this {{objectType}}',
  object: 'object',
  notValid: 'Definition of this {{objectType}} is not valid',
  objectTypeSubtitle: {
    [EdmObjectType.Aggregation]: 'Aggregated information about all related resources pertaining to the provided CHO.',
    [
      EdmObjectType.ProvidedCHO
    ]: 'This section contains information about the physical Cultural Heritage Object.',
    [
      EdmObjectType.WebResource
    ]: 'This section contains information about the digital representation of the Cultural Heritage Object (e.g. the 3D model).',
  },
};
