import { resolve } from 'rsvp';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { get } from '@ember/object';
import { lookupService } from './stub-service';
import _ from 'lodash';

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
export function mockRootFiles({ testCase, filesCount }) {
  const files = _.range(0, filesCount).map(i => {
    const name = `file-${i.toString().padStart(3, '0')}`;
    const entityId = name;
    const file = {
      id: generateFileId(entityId),
      entityId,
      name,
      index: name,
      type: 'file',
    };
    file.effFile = file;
    return file;
  });
  const fileManager = lookupService(testCase, 'fileManager');

  const mockArray = new MockArray(files);
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
  const spaceRootDir = createSpaceRootDir(spaceId);
  return createFile({
    entityId: createEntityId('special_dir', spaceId),
    name: '.__onedata__archive',
    type: 'dir',
    parentObject: spaceRootDir,
  });
}

export function createArchiveRootDir(...options) {
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
    datasetDirId = 'dataset_dir_id';
  }
  if (!archiveDirId) {
    archiveDirId = 'archive_dir_id';
  }
  const specialDir = createOnedataArchivesRootDir(spaceId);
  const datasetDir = createFile({
    entityId: createEntityId(datasetDirId, spaceId),
    name: `dataset_archives_${datasetId}`,
    type: 'dir',
    parentObject: specialDir,
  });
  const archiveDir = createFile({
    entityId: createEntityId(archiveDirId, spaceId),
    name: `archive_${archiveId}`,
    type: 'dir',
    parentObject: datasetDir,
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
    relationEntityId(relationName) {
      const relationObject = this[relationName + 'Object'];
      if (relationObject) {
        return get(relationObject, 'entityId') || null;
      } else {
        return null;
      }
    },
  }, override);
  if (!obj.entityId) {
    const randomGuid = String(Math.floor(Math.random() * 10000));
    obj.entityId = createEntityId(randomGuid);
  }
  return obj;
}

export function createFilesChain(filesDataArray) {
  const filesArray = [];
  for (let i = 0; i < filesDataArray.length; ++i) {
    const rawFileData = filesDataArray[i];
    const fileData = typeof rawFileData === 'object' ? filesDataArray[i] : {
      name: filesDataArray[i],
    };
    fileData.type = 'dir';
    if (i > 0) {
      fileData.hasParent = true;
      fileData.parent = promiseObject(resolve(filesArray[i - 1]));
    }
    filesArray.push(createFile(fileData));
  }
  filesArray[filesArray.length - 1].type = 'file';
  return filesArray;
}

export function createEntityId(guid, spaceId = defaultSpaceId) {
  return window.btoa(`guid#${guid}#${spaceId}`);
}

export function createPublicEntityId(guid, shareId, spaceId = defaultSpaceId) {
  return window.btoa(`shareGuid#${guid}#${spaceId}#${shareId}`);
}
