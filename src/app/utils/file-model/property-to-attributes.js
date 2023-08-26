// FIXME: jsdoc

/**
 * @type {Object<FileModel.Property, File.RawAttribute|Array<File.RawAttribute>}
 */
export const propertyToAttributesMap = Object.freeze({
  // attributes normalized by serializer to create ember-data relations
  archive: 'archiveId',
  owner: 'ownerId',
  parent: 'parentId',
  provider: 'providerId',
  shareRecords: 'shares',

  // runtime properties
  cdmiObjectId: 'fileId',
  dataIsProtected: 'effProtectionFlags',
  dataIsProtectedByDataset: 'effDatasetProtectionFlags',
  effFile: ['type', 'symlinkValue'],
  hasParent: 'parentId',
  internalFileId: 'fileId',
  isArchiveRootDir: 'archiveId',
  isRecalled: 'recallRootId',
  isRecalling: 'recallRootId',
  isShared: 'shares',
  metadataIsProtected: 'effProtectionFlags',
  metadataIsProtectedByDataset: 'effDatasetProtectionFlags',
  originalName: ['conflictingName', 'name'],
  recallingMembership: 'recallRootId',
  spaceEntityId: 'fileId',
});

// FIXME: eksportowane jest propertyToAttributesMap zamiast propertyToAttributes
// można przemyśleć, czy będzie jakaś funkcja, czy może przemianować plik albo główny eksport
