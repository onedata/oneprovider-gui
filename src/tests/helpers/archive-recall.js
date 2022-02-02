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
  const archive = store.createRecord('archive', {});
  const dataset = store.createRecord('dataset', {});
  const guid = createEntityId('file_guid');
  const targetFile = store.createRecord('file', {
    id: generateFileId(guid),
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
    totalFileCount: 100,
    totalByteSize: 10000,
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
    archive,
    dataset,
    targetFile,
    archiveRecallInfo,
    archiveRecallState,
  });
  await allFulfilled(Object.values(records).invoke('save'));
}
