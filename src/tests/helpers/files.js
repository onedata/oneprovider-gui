import { resolve } from 'rsvp';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';

export const defaultSpaceId = 'space_default_id';

export function createSpaceRootDir(spaceId = defaultSpaceId) {
  return createFile({
    entityId: createEntityId('space_root'),
    name: 'space_name_' + spaceId,
    type: 'dir',
    parentObject: null,
  });
}

export function createArchiveRootDir(datasetId, archiveId, spaceId = defaultSpaceId) {
  const spaceRootDir = createSpaceRootDir(spaceId);
  const specialDir = createFile({
    entityId: createEntityId('special_dir'),
    name: '.__onedata__archive',
    type: 'dir',
    parentObject: spaceRootDir,
  });
  const datasetDir = createFile({
    entityId: createEntityId('dataset_dir_id'),
    name: `dataset_archives_${datasetId}`,
    type: 'dir',
    parentObject: specialDir,
  });
  const archiveDir = createFile({
    entityId: createEntityId('archive_dir_id'),
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
