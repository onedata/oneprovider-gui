/**
 * Collection of known raw data attributes of file model in backend.
 * These attributes are translated into frontend file model properties in FileAdapter.
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

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
  // NOTE: there are also special attributes "xattr.*" for getting specific xattrs of file
  // record but its support is not implemented in frontend yet.
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
  // NOTE: there are also special attributes "xattr.*" for getting specific xattrs of file
  // record but its support is not implemented in frontend yet.
]);

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
