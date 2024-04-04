/**
 * Provides constants associated with known EDM metadata object types.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

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
