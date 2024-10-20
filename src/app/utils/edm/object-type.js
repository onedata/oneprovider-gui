/**
 * Provides constants associated with known EDM metadata object types.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import _ from 'lodash';

/**
 * @typedef {keyof EdmObjectType} EdmObjectType
 */

const EdmObjectType = Object.freeze({
  Aggregation: 'Aggregation',
  ProvidedCHO: 'ProvidedCHO',
  WebResource: 'WebResource',
});

export const supportedEdmObjectTypes = Object.values(EdmObjectType);

export const EdmObjectTagName = Object.freeze({
  [EdmObjectType.Aggregation]: 'ore:Aggregation',
  [EdmObjectType.ProvidedCHO]: 'edm:ProvidedCHO',
  [EdmObjectType.WebResource]: 'edm:WebResource',
});

export const TagToEdmObjectType = _.invert(EdmObjectTagName);

export default EdmObjectType;
