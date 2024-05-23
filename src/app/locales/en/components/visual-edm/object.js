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
  objectTypeTip: {
    [EdmObjectType.Aggregation]: 'Aggregated information about all related resources pertaining to the provided CHO',
    [
      EdmObjectType.ProvidedCHO
    ]: 'Information related to the original Cultural Heritage Object (CHO) — refers to the ProvidedCHO of EDM',
    [
      EdmObjectType.WebResource
    ]: 'Information related to a digital representation of the object — refers to the WebResource of EDM',
  },
};
