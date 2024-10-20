import { resolve } from 'rsvp';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { get } from '@ember/object';
import { lookupService } from './stub-service';
import _ from 'lodash';
import globals from 'onedata-gui-common/utils/globals';
import { LegacyFileType } from 'onedata-gui-common/utils/file';
import { v4 as uuid } from 'ember-uuid';

export const defaultSpaceId = 'space_default_id';

// Used in pure filesystem browsers tests.
export class MockArray {
  constructor(array) {
    if (!array) {
      throw new Error('file-browser-test MockArray: array not specified');
    }
    this.array = array;
  }
  fetch(
    fromIndex,
    size = Number.MAX_SAFE_INTEGER,
    offset = 0
  ) {
    const startIndex = fromIndex === null ?
      0 :
      this.array.findIndex(item => get(item, 'index') === fromIndex);
    const startOffset = Math.max(
      0,
      Math.min(startIndex + offset, this.array.length)
    );
    const endOffset = Math.min(startOffset + size, this.array.length);
    return resolve(this.array.slice(startOffset, endOffset));
  }
  async fetchChildren(dirId, scope, index, offset, limit) {
    const fetchResult = await this.fetch(index, offset, limit);
    const result = { childrenRecords: fetchResult, isLast: fetchResult.length < limit };
    return result;
  }
}

// Used in pure filesystem browsers tests.
export function generateFileId(entityId) {
  return `file.${entityId}.instance:private`;
}

// Used in pure filesystem browsers tests.
export function mockRootFiles({
  testCase,
  files,
  filesCount,
  rootDir = null,
  useStore = null,
}) {
  if (files && filesCount) {
    throw new Error('mockRootFiles: use only one of: files and filesCount');
  }
  let effFiles;
  if (files) {
    effFiles = files;
  } else {
    effFiles = _.range(0, filesCount || 0).map(i => {
      const name = `file-${i.toString().padStart(3, '0')}`;
      const entityId = name;
      const file = {
        id: generateFileId(entityId),
        name,
        index: name,
        type: 'file',
      };
      file.effFile = file;
      if (!useStore) {
        file.entityId = entityId;
      }
      return file;
    });
  }
  let createFileUsingSpec;
  if (useStore) {
    const store = lookupService(testCase, 'store');
    createFileUsingSpec = (fileSpec) =>
      store.createRecord('file', { parent: rootDir, ...fileSpec });
  } else {
    createFileUsingSpec = (fileSpec) =>
      createFile(Object.assign({ parentObject: rootDir }, fileSpec));
  }
  effFiles = effFiles.map(fileSpec => {
    return createFileUsingSpec(fileSpec);
  });
  const fileManager = lookupService(testCase, 'fileManager');

  const mockArray = new MockArray(effFiles);
  fileManager.fetchDirChildren = (...args) => mockArray.fetchChildren(...args);
  return mockArray;
}

export function createSpaceRootDir(spaceId = defaultSpaceId) {
  return createFile({
    entityId: createEntityId('space_root'),
    name: 'space_name_' + spaceId,
    type: 'dir',
    parentObject: null,
  });
}

export function createOnedataArchivesRootDir(spaceId = defaultSpaceId) {
  return createFile({
    entityId: createEntityId('special_dir', spaceId),
    name: '.__onedata__archive',
    type: 'dir',
  });
}

export async function createArchiveRootDir(store, ...options) {
  let datasetId;
  let archiveId;
  let spaceId;
  let datasetDirId;
  let archiveDirId;
  const firstOption = options[0];
  if (options.length === 1 && typeof firstOption === 'object') {
    datasetId = firstOption.datasetId;
    archiveId = options.archiveId;
    ({ datasetId, archiveId, spaceId, datasetDirId, archiveDirId } = firstOption);
  } else {
    [datasetId, archiveId, spaceId] = options;
  }
  if (!spaceId) {
    spaceId = defaultSpaceId;
  }
  if (!datasetDirId) {
    datasetDirId = 'dataset_dir_id_' + uuid();
  }
  if (!archiveDirId) {
    archiveDirId = 'archive_dir_id_' + uuid();
  }
  const specialDir = await store.createRecord('file', {
    name: '.__onedata__archive',
    type: 'dir',
  });
  const datasetDir = await store.createRecord('file', {
    id: generateFileId(createEntityId(datasetDirId, spaceId)),
    name: `dataset_archives_${datasetId}`,
    type: 'dir',
    parent: specialDir,
  });
  const archiveDir = await store.createRecord('file', {
    id: generateFileId(createEntityId(archiveDirId, spaceId)),
    name: `archive_${archiveId}`,
    type: 'dir',
    parent: datasetDir,
  });
  return archiveDir;
}

export function createShareRootDir(shareId, spaceId = defaultSpaceId) {
  return createFile({
    entityId: createPublicEntityId('share_root_123', shareId, spaceId),
    name: `share_root_${shareId}`,
    type: 'dir',
    scope: 'public',
    parentObject: null,
  });
}

export function createFile(override = {}) {
  const obj = Object.assign({
    posixPermissions: '777',
    type: 'file',
    scope: 'private',
    parent: promiseObject(resolve(override.parentObject || null)),
    hasParent: Boolean(override.parentObject),
    index: override.name,
    relationEntityId(relationName) {
      const relationObject = this[relationName + 'Object'];
      if (relationObject) {
        return get(relationObject, 'entityId') || null;
      } else {
        return null;
      }
    },
    // NOTE: the mock is incomplete - if you need to use belongsTo, better consider
    // rewriting mock methods to use real models and store
    belongsTo(relationName) {
      const entityId = this.relationEntityId(relationName);
      return {
        id() {
          return `${relationName}.${entityId}.instance:private`;
        },
      };
    },
  }, override);
  if (!obj.entityId) {
    const randomGuid = String(Math.floor(Math.random() * 10000));
    obj.entityId = createEntityId(randomGuid);
  }
  if (!obj.effFile && obj.type !== 'symlink') {
    obj.effFile = obj;
  }
  return obj;
}

export async function createFilesChain(store, filesDataArray) {
  const filesArray = [];
  for (let i = 0; i < filesDataArray.length; ++i) {
    const rawFileData = filesDataArray[i];
    const fileRecord = await (
      typeof rawFileData === 'object' ?
      rawFileData :
      store.createRecord('file', {
        name: filesDataArray[i],
        id: generateFileId(createEntityId(`${uuid()}`, 'space_id')),
        type: (i === filesDataArray.length - 1) ?
          LegacyFileType.Regular : LegacyFileType.Directory,
        parent: i > 0 ? filesArray[i - 1] : null,
      }));
    filesArray.push(fileRecord);
  }
  return filesArray;
}

export function createEntityId(guid, spaceId = defaultSpaceId) {
  return globals.window.btoa(`guid#${guid}#${spaceId}`);
}

export function createPublicEntityId(guid, shareId, spaceId = defaultSpaceId) {
  return globals.window.btoa(`shareGuid#${guid}#${spaceId}#${shareId}`);
}
