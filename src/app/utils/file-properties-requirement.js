/**
 * FIXME: doc
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FilePropertiesRequirementQuery from 'oneprovider-gui/utils/file-properties-requirement-query';
import _ from 'lodash';

/**
 * @type {Array<string>}
 */
const possibleFileRawAttributes = Object.freeze([
  'name',
  'mode',
  'guid',
  'activePermissionsType',
  'index',
  'ownerId',
  'providerId',
  'shares',
  // FIXME: czy to jest? chyba trzeba będzie stworzyć w serializerze na podstawie length
  'sharesCount',
  'type',
  'mtime',
  'localReplicationRate',
  'size',
  'recallRootId',
  'effDatasetMembership',
  'effDatasetProtectionFlags',
  'effProtectionFlags',
  'effQosMembership',
  'qosStatus',
  'hasMetadata',
  'posixPermissions',
  'hardlinksCount',
  'parentId',
  // FIXME: czy to jest? - wg pliku w op-workerze tak
  'conflictingName',
  // FIXME: czy to jest? - wg opw tak
  'targetPath',

  // FIXME: atrybuty przepisane z op-workera
  'conflictingFiles',
  'fileId',
  'symlinkValue',
  'isDeleted',
]);

export const possibleFileRawAttributesSet = new Set(possibleFileRawAttributes);

const possibleFileProperties = Object.freeze([
  'name',
  'index',
  'type',
  'size',
  'posixPermissions',
  'hasMetadata',
  'localReplicationRate',
  'sharesCount',
  'hardlinksCount',
  'conflictingName',
  'targetPath',
  'effQosMembership',
  'effDatasetMembership',
  'effDatasetProtectionFlags',
  'effProtectionFlags',
  'recallRootId',
  'mtime',
  'activePermissionsType',
  'shareRecords',
  'acl',
  'parent',
  'distribution',
  'storageLocationInfo',
  'owner',
  'provider',
  'fileQosSummary',
  'fileDatasetSummary',
  'archiveRecallInfo',
  'archiveRecallState',
  'archive',

  // FIXME: alias na mtime - powinno się to usunąć na rzecz mtime
  'modificationTime',
  // FIXME: runtime properties zależne od properties - zaimplementować
  'originalName', // FIXME: zależy od conflictingName, name
  'effFile', // FIXME: 'type', 'symlinkTargetFile'
  'dataIsProtected',
  'metadataIsProtected',
  'dataIsProtectedByDataset',
  'metadataIsProtectedByDataset',
  'isShared',
  'cdmiObjectId',
  'hasParent',
  'isArchiveRootDir',
  'spaceEntityId',
  'internalFileId',
  'recallingMembership',
  'isRecalling',
  'isRecalled',
]);

// FIXME: przenieść do serializera/file?
/**
 * @typedef {typeof possibleFileRawAttributes[number]} File.RawAttribute
 */

/**
 * @typedef {typeof possibleFileProperties[number]} File.Property
 */

export default FilePropertiesRequirementQuery.extend({
  /**
   * @virtual
   * @type {File.Property}
   */
  properties: undefined,

  /**
   * @type {Array<File.RawAttribute>}
   */
  getAttrs() {
    // FIXME: na razie zwraca stare atrybuty
    // FIXME: powinno zwracać zawsze zestaw podstawowywch atrybutów
    return _.without(
      possibleFileRawAttributes,
      'localReplicationRate',
      'qosStatus'
    );
  },
});
