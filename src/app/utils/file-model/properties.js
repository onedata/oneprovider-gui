/**
 * Collection of known properties of frontend File model.
 * Includes runtime properties (not only model attributes and relations).
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

/**
 * @typedef {typeof possibleFileProperties[number]} FileModel.Property
 */

export const possibleFileProperties = Object.freeze([
  // model properties
  'acl',
  'activePermissionsType',
  'archive',
  'archiveRecallInfo',
  'archiveRecallState',
  'atime',
  'conflictingName',
  'ctime',
  'distribution',
  'effDatasetMembership',
  'effDatasetProtectionFlags',
  'effProtectionFlags',
  'effQosMembership',
  'fileDatasetSummary',
  'fileQosSummary',
  'hardlinkCount',
  'hasMetadata',
  'index',
  'localReplicationRate',
  'mtime',
  'name',
  'owner',
  'parent',
  'posixPermissions',
  'provider',
  'qosStatus',
  'recallRootId',
  'shareRecords',
  'size',
  'storageGroupId',
  'storageLocationInfo',
  'storageUserId',
  'symlinkValue',
  'type',

  // runtime properties
  'cdmiObjectId',
  'dataIsProtected',
  'dataIsProtectedByDataset',
  'effFile',
  'hasParent',
  'internalFileId',
  'isArchiveRootDir',
  'isRecalled',
  'isRecalling',
  'isShared',
  'metadataIsProtected',
  'metadataIsProtectedByDataset',
  'originalName',
  'recallingMembership',
  'recallingMembershipProxy',
  'sharesCount',
  'spaceEntityId',
]);

export default possibleFileProperties;
