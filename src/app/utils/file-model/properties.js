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
  'archiveRecallInfo',
  'archiveRecallState',
  'atime',
  'conflictingName',
  'ctime',
  'displayGid',
  'displayUid',
  'distribution',
  'effDatasetMembership',
  'effDatasetProtectionFlags',
  'effProtectionFlags',
  'effQosMembership',
  'fileDatasetSummary',
  'fileId',
  'fileQosSummary',
  'hardlinkCount',
  'hasCustomMetadata',
  'index',
  'isFullyReplicatedLocally',
  'localReplicationRate',
  'mtime',
  'name',
  'owner',
  'parent',
  'path',
  'posixPermissions',
  'provider',
  'qosStatus',
  'recallRootId',
  'shareRecords',
  'size',
  'storageLocationInfo',
  'symlinkValue',
  'type',

  // runtime properties
  'cdmiObjectId',
  'dataIsProtected',
  'dataIsProtectedByDataset',
  'effFile',
  'hasParent',
  'internalFileId',
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
