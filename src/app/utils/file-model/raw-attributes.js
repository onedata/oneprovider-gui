// FIXME: jsdoc

import _ from 'lodash';

/**
 * @typedef {typeof possibleFileRawAttributes[number]} FileModel.RawAttribute
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

export const sharedFileRawAttributes = Object.freeze([
  'atime',
  'ctime',
  'fileId',
  'index',
  'mtime',
  'name',
  'parentId',
  'posixPermissions',
  'shares',
  'size',
  'type',
]);

// FIXME: zawrzeć jakoś wiedzę o specjalnym atrybucie: "xattr.*"

/**
 * @type {Set<File.RawAttribute>}
 */
export const possibleFileRawAttributesSet = new Set(possibleFileRawAttributes);

export const sharedFileRawAttributesSet = new Set(sharedFileRawAttributes);

export const onlyPrivateFileRawAttributesSet = new Set(
  _.difference(possibleFileRawAttributes, sharedFileRawAttributes)
);

/**
 * @param {Array<FileModel.RawAttribute>} attributes
 * @returns {Array<FileModel.RawAttribute>}
 */
export function pullPrivateFileAttributes(attributes) {
  if (
    attributes.some(attr => onlyPrivateFileRawAttributesSet.has(attr))
  ) {
    const privateFileAttributes = attributes.filter(attr =>
      onlyPrivateFileRawAttributesSet.has(attr)
    );
    console.warn(
      'Filtering-out private-scope-only file attributes',
      privateFileAttributes
    );
    _.pull(attributes, ...privateFileAttributes);
  }
}

export default possibleFileRawAttributes;
