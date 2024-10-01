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
  'archiveRecallRootFileId',
  'archiveRecallState',
  'atime',
  'conflictingName',
  'ctime',
  // TODO: VFS-12343 restore creationTime in GUI
  // 'creationTime',
  'displayGid',
  'displayUid',
  'distribution',
  'effDatasetInheritancePath',
  'effDatasetProtectionFlags',
  'effProtectionFlags',
  'effQosInheritancePath',
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
  'aggregateQosStatus',
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
  'recallingInheritancePath',
  'recallingInheritancePathProxy',
  'sharesCount',
  'spaceEntityId',
]);

export default possibleFileProperties;
