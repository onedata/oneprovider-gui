// FIXME: jsdoc

/**
 * @typedef {typeof possibleFileRawAttributes[number]} File.RawAttribute
 */

/**
 * @type {Array<File.RawAttribute>}
 */
export const possibleFileRawAttributes = Object.freeze([
  'activePermissionsType',
  'archiveId',
  'atime',
  'conflictingFiles',
  'conflictingName',
  'ctime',
  'effDatasetMembership',
  'effDatasetProtectionFlags',
  'effProtectionFlags',
  'effQosMembership',
  'fileId',
  'hardlinksCount',
  'hasMetadata',
  'index',
  'isFullyReplicated',
  'isDeleted',
  'localReplicationRate',
  'mtime',
  'name',
  'ownerId',
  'parentId',
  'posixPermissions',
  'providerId',
  'qosStatus',
  'recallRootId',
  'shares',
  'size',
  'storageGroupId',
  'storageUserId',
  'symlinkValue',
  'type',
]);

// FIXME: zawrzeć jakoś wiedzę o specjalnym atrybucie: "xattr.*"

/**
 * @type {Set<File.RawAttribute>}
 */
export const possibleFileRawAttributesSet = new Set(possibleFileRawAttributes);

export default possibleFileRawAttributes;
