import { lookupService } from './stub-service';
import { all as allFulfilled } from 'rsvp';
import { entityType as fileEntityType } from 'oneprovider-gui/models/file';
import { aspect as archiveRecallInfoAspect } from 'oneprovider-gui/models/archive-recall-info';
import { aspect as archiveRecallStateAspect } from 'oneprovider-gui/models/archive-recall-state';
import { generateFileId, createEntityId } from './files';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { get, setProperties } from '@ember/object';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';
import { promiseArray } from 'onedata-gui-common/utils/ember/promise-array';
import { entityType as providerEntityType } from 'oneprovider-gui/models/provider';
import { run } from '@ember/runloop';
import sinon from 'sinon';

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
      filesFailed: 0,
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
    lastError: {},
  });
  const archiveRecallState = store.createRecord('archiveRecallState', {
    id: stateGri,
    bytesCopied: 0,
    filesCopied: 0,
    filesFailed: 0,
    lastError: null,
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

export async function createDataset(testCase) {
  const store = lookupService(testCase, 'store');
  const spaceId = 's123';
  const fileName = 'dummy_dataset_root';
  const datasetRootFile = store.createRecord('file', {
    index: fileName,
    name: fileName,
    type: 'dir',
  });
  const dataset = store.createRecord('dataset', {
    index: 'd123',
    spaceId,
    state: 'attached',
    rootFile: datasetRootFile,
    rootFilePath: `/one/two/${fileName}`,
  });
  const records = [
    datasetRootFile,
    dataset,
  ];
  const result = testCase.setProperties({
    datasetRootFile,
    dataset,
  });
  await allFulfilled(Object.values(records).invoke('save'));
  return result;
}

export async function createArchive(testCase) {
  const dataset = testCase.get('dataset');
  const store = lookupService(testCase, 'store');
  const archiveManager = lookupService(testCase, 'archiveManager');
  const totalFileCount = 100;
  const totalByteSize = 10000;
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
      filesFailed: 0,
    },
    dataset,
  });
  const records = [
    archive,
  ];
  await allFulfilled(Object.values(records).invoke('save'));
  const browsableArchive = await archiveManager.getBrowsableArchive(archive);
  const result = testCase.setProperties({
    archive,
    browsableArchive,
  });
  return result;
}

/**
 * Legacy helper using non-store mocking - please use store models mocking in new code.
 * @returns {Object} dataset-like
 */
export function createFileDatasetSummary({
  directDataset = null,
  effAncestorDatasets = [],
} = {}) {
  return {
    getRelation(relation) {
      if (relation === 'directDataset') {
        return promiseObject(resolve(directDataset));
      }
    },
    belongsTo(relation) {
      if (relation === 'directDataset') {
        return {
          id: () => directDataset ? get(directDataset, 'id') : null,
          async load() {
            return directDataset;
          },
          async reload() {
            return directDataset;
          },
        };
      }
    },
    hasMany(relation) {
      if (relation === 'effAncestorDatasets') {
        return {
          load() {
            return promiseArray(resolve(effAncestorDatasets));
          },
          reload() {
            return promiseArray(resolve(effAncestorDatasets));
          },
        };
      }
    },
  };
}

export function whenOnLocalProvider(testCase) {
  const providerId = 'provider_id';
  const store = lookupService(testCase, 'store');
  const provider = store.createRecord('provider', {
    id: gri({
      entityType: providerEntityType,
      entityId: providerId,
      aspect: 'instance',
    }),
    name: 'Dummy provider',
  });
  const providerManager = lookupService(testCase, 'providerManager');
  providerManager.getCurrentProviderId = () => get(provider, 'entityId');
  run(() => {
    testCase.set('archiveRecallInfo.recallingProvider', provider);
  });
}

export function whenOnRemoteProvider(testCase) {
  const store = lookupService(testCase, 'store');
  const localProviderId = 'local_provider_id';
  const localProvider = store.createRecord('provider', {
    id: gri({
      entityType: providerEntityType,
      entityId: localProviderId,
      aspect: 'instance',
    }),
    name: 'Local provider',
  });
  const recallingProviderId = 'recalling_provider_id';
  const recallingProvider = store.createRecord('provider', {
    id: gri({
      entityType: providerEntityType,
      entityId: recallingProviderId,
      aspect: 'instance',
    }),
    name: 'Recalling provider',
  });
  const providerManager = lookupService(testCase, 'providerManager');
  providerManager.getCurrentProviderId = () => get(localProvider, 'entityId');
  run(() => {
    testCase.set('archiveRecallInfo.recallingProvider', recallingProvider);
  });
}

/**
 * @param {Mocha.Context} testCase
 */
export function stubEmptyRecallLogs(testCase) {
  const fileManager = lookupService(testCase, 'fileManager');
  sinon.stub(fileManager, 'getRecallLogs').resolves({
    array: [],
    isLast: true,
  });
}
