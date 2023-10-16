/**
 * Mapping of dependent raw file data attributes needed by frontend file model properties.
 * For example, a runtime-specific file model property "sharesCount" needs a raw "shares"
 * file data property to be evaulated. If some FileConsumer needs to use "sharesCount"
 * file property then the file requirement system must ask backend for "shares" attribute.
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

/**
 * @type {Object<FileModel.Property, File.RawAttribute|Array<File.RawAttribute>}
 */
export const propertyToAttributesMap = Object.freeze({
  // attributes normalized by serializer to create ember-data relations
  owner: 'ownerUserId',
  parent: 'parentFileId',
  provider: 'originProviderId',
  shareRecords: 'directShareIds',

  // runtime properties
  cdmiObjectId: 'fileId',
  dataIsProtected: 'effProtectionFlags',
  dataIsProtectedByDataset: 'effDatasetProtectionFlags',
  effFile: ['type', 'symlinkValue'],
  hasParent: 'parentFileId',
  internalFileId: 'fileId',
  isRecalled: 'recallRootId',
  isRecalling: 'recallRootId',
  isShared: 'directShareIds',
  sharesCount: 'directShareIds',
  metadataIsProtected: 'effProtectionFlags',
  metadataIsProtectedByDataset: 'effDatasetProtectionFlags',
  originalName: ['conflictingName', 'name'],
  recallingMembership: 'recallRootId',
  recallingMembershipProxy: 'recallRootId',
  spaceEntityId: 'fileId',
});

export default propertyToAttributesMap;
