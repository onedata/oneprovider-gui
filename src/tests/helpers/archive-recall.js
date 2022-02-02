import { lookupService } from './stub-service';
import { all as allFulfilled } from 'rsvp';
import { entityType as fileEntityType } from 'oneprovider-gui/models/file';
import { aspect as archiveRecallInfoAspect } from 'oneprovider-gui/models/archive-recall-info';
import { aspect as archiveRecallStateAspect } from 'oneprovider-gui/models/archive-recall-state';
import { generateFileId, createEntityId } from './files';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { get, setProperties } from '@ember/object';

export async function createArchiveRecallData(testCase) {
  const store = lookupService(testCase, 'store');
  const totalFileCount = 100;
  const totalByteSize = 10000;
  const spaceId = 's123';
  const datasetRootFile = store.createRecord('file', {
    index: 'dummy_dataset_root',
    name: 'dummy_dataset_root',
    type: 'dir',
  });
  const dataset = store.createRecord('dataset', {
    index: 'd123',
    spaceId,
    state: 'attached',
    rootFile: datasetRootFile,
    rootFilePath: '/one/two/dummy_dataset_root',
  });
  const archive = store.createRecord('archive', {
    index: '123',
    state: 'preserved',
    creationTime: Date.now() / 1000,
    config: {
      createNestedArchives: false,
      incremental: {
        enabled: false,
      },
      layout: 'plain',
      includeDip: false,
    },
    description: 'foobarchive',
    stats: {
      filesArchived: totalFileCount,
      bytesArchived: totalByteSize,
      failedFiles: 0,
    },
    dataset,
  });
  const guid = createEntityId('file_guid');
  const targetParent1 = store.createRecord('file', {
    id: generateFileId('p1'),
    type: 'dir',
    parent: null,
    name: 'parent1',
  });
  const targetParent2 = store.createRecord('file', {
    id: generateFileId('p2'),
    type: 'dir',
    parent: targetParent1,
    name: 'parent2',
  });
  const targetParent3 = store.createRecord('file', {
    id: generateFileId('p3'),
    type: 'dir',
    parent: targetParent2,
    name: 'parent3',
  });
  const targetFile = store.createRecord('file', {
    id: generateFileId(guid),
    parent: targetParent3,
    name: 'test_file',
  });
  const infoGri = gri({
    entityType: fileEntityType,
    entityId: guid,
    aspect: archiveRecallInfoAspect,
  });
  const stateGri = gri({
    entityType: fileEntityType,
    entityId: guid,
    aspect: archiveRecallStateAspect,
  });
  const archiveRecallInfo = store.createRecord('archiveRecallInfo', {
    id: infoGri,
    archive,
    dataset,
    totalFileCount,
    totalByteSize,
    startTime: null,
    finishTime: null,
  });
  const archiveRecallState = store.createRecord('archiveRecallState', {
    id: stateGri,
    bytesCopied: 0,
    filesCopied: 0,
    filesFailed: 0,
    lastError: 0,
  });
  setProperties(targetFile, {
    recallRootId: get(targetFile, 'entityId'),
    archiveRecallInfo,
    archiveRecallState,
  });
  const records = testCase.setProperties({
    datasetRootFile,
    dataset,
    archive,
    targetParent1,
    targetParent2,
    targetParent3,
    targetFile,
    archiveRecallInfo,
    archiveRecallState,
  });
  await allFulfilled(Object.values(records).invoke('save'));
}

export async function getBrowsableArchiveName(testCase) {
  const archiveManager = lookupService(testCase, 'archive-manager');
  const browsableArchive =
    await archiveManager.getBrowsableArchive(testCase.get('archive'));
  return get(browsableArchive, 'name');
}

export async function getBrowsableDatasetName(testCase) {
  const datasetManager = lookupService(testCase, 'dataset-manager');
  const browsableDataset =
    await datasetManager.getBrowsableDataset(testCase.get('dataset'));
  return get(browsableDataset, 'name');
}
