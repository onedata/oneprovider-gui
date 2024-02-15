/**
 * Collections of known properties and attributes of file model and utils for checking
 * them.
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

export { possibleFileProperties } from './file-model/properties';
export { propertyToAttributesMap } from './file-model/property-to-attributes';
export {
  possibleFileRawAttributes,
  possibleFileRawAttributesSet,
  onlyPrivateFileRawAttributesSet,
  pullPrivateFileAttributes
}
from './file-model/raw-attributes';
