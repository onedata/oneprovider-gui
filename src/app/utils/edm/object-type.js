/**
 * @typedef {keyof EdmObjectType} EdmObjectType
 */

const EdmObjectType = Object.freeze({
  Aggregation: 'Aggregation',
  ProvidedCHO: 'ProvidedCHO',
  WebResource: 'WebResource',
});

export const supportedEdmObjectTypes = Object.values(EdmObjectType);

export default EdmObjectType;
