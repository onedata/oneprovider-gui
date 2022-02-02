/**
 * Creates and shares a state of mocked data model
 *
 * @module services/mock-backend
 * @author Jakub Liput
 * @copyright (C) 2019-2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { camelize } from '@ember/string';
import { get, getProperties, set, setProperties, computed } from '@ember/object';
import { all as allFulfilled, hash as hashFulfilled, resolve } from 'rsvp';
import gri from 'onedata-gui-websocket-client/utils/gri';
import _ from 'lodash';
import {
  generateSpaceEntityId,
  generateShareEntityId,
  getCoordinates,
} from 'onedata-gui-websocket-client/utils/development-model-common';
import { mockGuiContext } from 'onedata-gui-common/initializers/fetch-gui-context';
import { entityType as fileEntityType, datasetSummaryAspect } from 'oneprovider-gui/models/file';
import { entityType as providerEntityType } from 'oneprovider-gui/models/provider';
import { entityType as spaceEntityType } from 'oneprovider-gui/models/space';
import { entityType as shareEntityType } from 'oneprovider-gui/models/share';
import { entityType as transferEntityType } from 'oneprovider-gui/models/transfer';
import { entityType as qosEntityType } from 'oneprovider-gui/models/qos-requirement';
import { entityType as datasetEntityType } from 'oneprovider-gui/models/dataset';
import { entityType as archiveEntityType } from 'oneprovider-gui/models/archive';
import { entityType as atmWorkflowSchemaEntityType } from 'oneprovider-gui/models/atm-workflow-schema';
import { entityType as atmWorkflowExecutionEntityType } from 'oneprovider-gui/models/atm-workflow-execution';
import { entityType as atmTaskExecutionEntityType } from 'oneprovider-gui/models/atm-task-execution';
import { entityType as atmStoreEntityType } from 'oneprovider-gui/models/atm-store';
import {
  exampleMarkdownLong as exampleMarkdown,
  exampleDublinCore,
} from 'oneprovider-gui/utils/mock-data';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import { aspect as archiveRecallInfoAspect } from 'oneprovider-gui/models/archive-recall-info';
import { aspect as archiveRecallStateAspect } from 'oneprovider-gui/models/archive-recall-state';

const userEntityId = 'stub_user_id';
const fullName = 'Stub user';
const username = 'admin';

const modelTypes = [
  'provider',
  'space',
  'handleService',
  'atmInventory',
];

export const defaultRecordNames = ['One', 'Two', 'Three'];

export const recordNames = {
  // Uncomment for pretty names
  // provider: ['Cracow', 'Paris', 'Lisbon'],
  // Uncomment for various one-env-like names
  provider: [
    'dev-oneprovider-krakow-test',
    'dev-paris',
    'dev-oneprovider-lisbon-and-its-a-very-long-name',
  ],
  space: defaultRecordNames,
  atmInventory: defaultRecordNames,
};

export const numberOfProviders = 3;
export const numberOfSpaces = 1;
export const numberOfFiles = 200;
export const numberOfDirs = 5;
export const numberOfChainDirs = 5;
export const numberOfTransfers = 150;
export const numberOfAtmWorkflowExecutions = 150;

export const storageIdAlpha = '90ca74738947307403740234723bca7890678acb5c7bac567b8ac';
export const storageIdBeta = '39a423bbc90437434723bca789ab9ddc8a7abd8b8b8a232731901';

const transferStates = ['waiting', 'ongoing', 'ended'];
const atmWorkflowExecutionPhases = ['waiting', 'ongoing', 'ended'];
const atmWorkflowExecutionStatusForPhase = {
  waiting: 'enqueued',
  ongoing: 'active',
  ended: 'finished',
};

const protectionFlagSets = [
  [],
  ['data_protection'],
  ['metadata_protection'],
  ['data_protection', 'metadata_protection'],
];

const effProtectionFlagSets = [
  [],
  ['data_protection'],
  ['data_protection', 'metadata_protection'],
];

export default Service.extend({
  store: service(),
  archiveManager: service(),

  /**
   * WARNING: Will be initialized only after generating development model.
   * Will generate: `{ <state>: [], ... }`
   */
  allTransfers: computed(() => transferStates.reduce((obj, state) => {
    obj[state] = [];
    return obj;
  }, {})),

  /**
   * WARNING: Will be initialized only after generating development model.
   * Will generate: `{ <state>: [], ... }`
   */
  allAtmWorkflowExecutionSummaries: computed(() =>
    atmWorkflowExecutionPhases.reduce((obj, phase) => {
      obj[phase] = [];
      return obj;
    }, {})
  ),

  /**
   * WARNING: Will be initialized only after generating development model.
   * All entity records of some type.
   * Is an object where key is model name and values are arrays with records.
   * Contains also special collections:
   * - chainDir - files records that are chained directories
   */
  entityRecords: computed(() => ({})),

  /**
   * WARNING: Will be initialized only after generating development model.
   * Contains mapping:
   * symlink entityId -> linked file entityId
   */
  symlinkMap: computed(() => ({})),

  generateDevelopmentModel() {
    const store = this.get('store');
    const promiseHash = {};
    let promiseChain = resolve();
    // promiseChain guarantees that entity records will be created after fulfifillment
    // of previous records creation - needed eg.by providers -> spaces
    modelTypes.forEach(type => {
      promiseChain = promiseChain.then(() => {
        const createRecordsPromise = this.createEntityRecords(
            store,
            type,
            recordNames[type] ||
            defaultRecordNames
          )
          .then(records => this.createListRecord(store, type, records));
        promiseHash[type] = createRecordsPromise;
        return createRecordsPromise;
      });
    });
    return this.createEmptyQos(store).then(() =>
        this.createEmptyDatasetSummary(store)
      )
      .then(() =>
        promiseChain.then(() => hashFulfilled(promiseHash))
      )
      .then((listRecords) => {
        const { space: spaceList } = listRecords;
        return store.createRecord('user', {
          fullName: 'John Smith',
          username: 'smith',
        }).save().then(owner => {
          const entityRecords = this.get('entityRecords');
          if (!get(entityRecords, 'owner')) {
            set(entityRecords, 'owner', []);
          }
          get(entityRecords, 'owner').push(owner);
          return get(spaceList, 'list').then(list => {
              return list.forEach(space => {
                return get(space, 'rootDir').then(rootDir => {
                  this.set('entityRecords.rootDir', [rootDir]);
                  return this.createFileRecords(store, rootDir, owner)
                    .then(() => this.createTransferRecords(store))
                    .then((transferList) => {
                      const dataSourceId = get(rootDir, 'entityId');
                      const firstProvider =
                        this.get('entityRecords.provider')[0];
                      // currently to make it simpler, all files are rootDir
                      return allFulfilled(
                        transferList.map((transfer) => {
                          setProperties(transfer, {
                            type: 'replication',
                            dataSourceId,
                            user: owner,
                            replicatingProvider: firstProvider,
                          });
                          return transfer.save();
                        })
                      );
                    });
                });
              });
            })
            .then(() => listRecords);
        });
      })
      .then(listRecords =>
        this.pushProviderListIntoSpaces(listRecords).then(() => listRecords)
      )
      .then(listRecords =>
        this.pushSpaceListIntoProviders(listRecords).then(() => listRecords)
      )
      .then(listRecords => {
        return this.createAndAddShare(store).then(() => listRecords);
      })
      .then(listRecords => {
        return this.createAndAddQos(store).then(() => listRecords);
      })
      .then(listRecords => {
        return this.createDatasetMock(store).then(() => listRecords);
      })
      .then(listRecords => {
        return this.createArchivesMock(store).then(() => listRecords);
      })
      .then(listRecords => {
        return this.createAtmWorkflowExecutionRecords(store).then(() => listRecords);
      })
      .then(async listRecords => {
        await this.createRecallState(store);
        return listRecords;
      })
      .then(listRecords => this.createUserRecord(store, listRecords))
      .then(user => {
        return user.get('effSpaceList')
          .then(effSpaceList => get(effSpaceList, 'list'))
          .then(list => allFulfilled(list.toArray()))
          .then(() => user);
      });
  },

  createListRecord(store, type, records) {
    const listType = type + 'List';
    const listRecord = store.createRecord(listType, {});
    return get(listRecord, 'list').then(list => {
      list.pushObjects(records);
      return list.save().then(() => listRecord.save());
    });
  },

  createFileDistribution(store) {
    const providerIds = this.get('entityRecords.provider').mapBy('entityId');
    const providersCount = providerIds.length;
    const distributionPerProvider = {};
    for (let i = 0; i < providersCount; ++i) {
      const start = Math.floor((i / providersCount) * 320);
      const end = Math.floor(((i + 1) / providersCount) * 320);
      distributionPerProvider[providerIds[i]] = {
        blocksPercentage: 100 / providersCount,
        chunksBarData: {
          0: 0,
          [start]: 100,
          [end]: 0,
        },
      };
    }
    return store.createRecord('fileDistribution', {
      distributionPerProvider,
    }).save().then(fileDistribution => {
      this.set('entityRecords.fileDistribution', [fileDistribution]);
    });
  },

  createEmptyQos(store) {
    return store.createRecord('fileQosSummary', {
      requirements: {},
    }).save().then(qosSummary => {
      this.set('entityRecords.fileQosSummary', [qosSummary]);
    });
  },

  async createEmptyDatasetSummary(store) {
    const emptySummary = await store.createRecord('fileDatasetSummary', {
      directDataset: null,
      effAncestorDatasets: [],
      effProtectionFlags: [],
    }).save();
    this.set('entityRecords.fileDatasetSummary', [emptySummary]);
    return emptySummary;
  },

  makeFilesConflict() {
    const files = this.get('entityRecords.file');
    const file0 = files[0];
    const file1 = files[1];
    setProperties(file0, {
      name: 'hello@abc100',
      index: 'hello',
    });
    setProperties(file1, {
      name: 'hello',
      index: 'hello',
    });
    return allFulfilled([file0.save(), file1.save()]);
  },

  /**
   * Makes symbolic link on `symlinkDir` to point to `targetDir`.
   * @param {Models.File} symlinkDir
   * @param {Models.File} targetDir must be in the same directory as `symlinkDir`
   * @returns {Models.File}
   */
  async symlinkizeDirectory(symlinkDir, targetDir) {
    setProperties(symlinkDir, {
      type: 'symlink',
      posixPermissions: '777',
      size: 20,
      distribution: null,
      fileQosSummary: null,
      fileDatasetSummary: null,
      targetPath: `./${get(targetDir, 'name')}`,
    });
    const symlinkMap = this.get('symlinkMap');
    symlinkMap[get(symlinkDir, 'entityId')] = get(targetDir, 'entityId');
    return symlinkDir.save();
  },

  createAndAddQos(store) {
    const entityRecords = this.get('entityRecords');
    const providerId = get(entityRecords, 'provider.0.entityId');
    const chainDir = get(entityRecords, 'chainDir')[2];
    const qos1Promise = store.createRecord('qosRequirement', {
      id: gri({
        entityType: qosEntityType,
        entityId: 'q1',
        aspect: 'instance',
      }),
      status: 'fulfilled',
      replicasNum: 200,
      expressionRpn: [
        'storageId',
        storageIdBeta,
        '=',
        'providerId',
        providerId,
        '=',
        '|',
        'speed',
        87,
        '<=',
        'very_long_long_long_long_long_long_key',
        'Culpa consectetur consectetur enim esse amet incididunt velit aliqua cupidatat labore nostrud laboris irure.',
        '=',
        '\\',
        'storageId',
        'not_exist',
        '=',
        '|',
        '&',
      ],
      file: chainDir,
    }).save();
    const qos2Promise = store.createRecord('qosRequirement', {
      id: gri({
        entityType: qosEntityType,
        entityId: 'q2',
        aspect: 'instance',
      }),
      status: 'fulfilled',
      replicasNum: 1,
      expressionRpn: ['anyStorage', 'anyStorage', '\\'],
      file: get(entityRecords, 'chainDir')[1],
      // uncomment here for short inherited path
      // file: get(entityRecords, 'rootDir')[0],
    }).save();
    const qos3Promise = store.createRecord('qosRequirement', {
      id: gri({
        entityType: qosEntityType,
        entityId: 'q3',
        aspect: 'instance',
      }),
      status: 'fulfilled',
      replicasNum: 2,
      expressionRpn: ['anyStorage'],
      file: get(entityRecords, 'chainDir')[1],
    }).save();
    return allFulfilled([
      qos1Promise,
      qos2Promise,
      qos3Promise,
    ]).then(([
      qos1,
      qos2,
      qos3,
    ]) => {
      return store.createRecord('fileQosSummary', {
        requirements: {
          [get(qos1, 'entityId')]: 'fulfilled',
          [get(qos2, 'entityId')]: 'impossible',
          [get(qos3, 'entityId')]: 'pending',
        },
      }).save();
    }).then(fileQosSummary => {
      set(chainDir, 'fileQosSummary', fileQosSummary);
      return chainDir.save();
    });
  },

  createAndAddShare(store) {
    const entityRecords = this.get('entityRecords');
    const rootFile = get(entityRecords, 'chainDir')[2];
    const space = get(entityRecords, 'space')[0];
    const handlePrivate = store.createRecord('handle', {
      url: 'http://hdl.handle.net/21.T15999/zppPvhg',
      handleService: this.get('entityRecords.handleService')[0],
      metadataString: exampleDublinCore,
    });
    const handlePublic = store.createRecord('handle', {
      url: 'http://hdl.handle.net/21.T15999/zppPvhg',
      handleService: null,
      metadataString: exampleDublinCore,
    });
    const spaceId = this.get('entityRecords.space.0.entityId');
    const shares = ['private', 'public'].map(scope => {
      return [0, 1].map(num => {
        const entityId = generateShareEntityId(get(space, 'entityId'), num);
        const publicUrl = location.origin + '/shares/' + entityId;
        const publicRestUrl = location.origin + '/api/v3/shares/' + entityId + '/public';
        return store.createRecord('share', {
          id: gri({
            entityType: shareEntityType,
            entityId,
            aspect: 'instance',
            scope,
          }),
          fileType: 'dir',
          name: `My share ${num}`,
          spaceId,
          rootFile,
          privateRootFile: rootFile,
          publicUrl,
          publicRestUrl,
          handle: num % 2 === 0 ?
            (scope === 'private' ? handlePrivate : handlePublic) : null,
          description: exampleMarkdown,
        });
      });
    }).flat();
    return allFulfilled([handlePrivate.save(), handlePublic.save()])
      .then(handles => {
        this.set('entityRecords.handle', handles);
      })
      .then(() => allFulfilled(shares.map(share => share.save())))
      .then(([privateShare0, privateShare1]) => allFulfilled([
        addShareList(rootFile, [privateShare0, privateShare1], store, {
          sharesCount: 2,
        }),
        addShareList(space, [privateShare0, privateShare1], store),
      ]));
  },

  /**
   * @param {Service} store
   * @param {Array<String>} names
   * @returns {Promise<Array<Model>>}
   */
  createSpaceRecords(store, names) {
    const timestamp = getCurrentTimestamp();
    const provider = this.get('entityRecords.provider.firstObject');
    const providerId = get(provider, 'entityId');
    const fileQosSummary = this.get('entityRecords.fileQosSummary.firstObject');
    const emptyDatasetSummary = this.get('entityRecords.fileDatasetSummary.firstObject');
    return allFulfilled(_.range(numberOfSpaces).map((i) =>
        // root dirs
        store.createRecord('file', {
          id: generateFileGri(generateDirEntityId(0, '')),
          name: names[i],
          type: 'dir',
          mtime: timestamp + i * 3600,
          hasMetadata: false,
          effQosMembership: i < 2 && 'direct' ||
            i < 4 && 'ancestor' ||
            'none',
          parent: null,
          posixPermissions: '777',
          fileQosSummary,
          fileDatasetSummary: emptyDatasetSummary,
          provider,
        }).save()
      ))
      .then(rootDirs => allFulfilled(_.range(numberOfSpaces).map((i) => {
        this.set('entityRecords.spaceRootDir', rootDirs);
        return store.createRecord('space', {
          id: gri({
            entityType: spaceEntityType,
            entityId: generateSpaceEntityId(i),
            aspect: 'instance',
            scope: 'private',
          }),
          name: names[i],
          rootDir: rootDirs[i],
          providersWithReadonlySupport: [providerId],
          currentUserIsOwner: false,
          currentUserEffPrivileges: [
            'space_view',
            'space_view_qos',
            'space_view_transfers',
            'space_read_data',
            'space_write_data',
            'space_manage_qos',
            'space_manage_datasets',
            'space_create_archives',
            'space_recall_archives',
            'space_view_archives',
            'space_remove_archives',
            'space_view_atm_workflow_executions',
            'space_schedule_atm_workflow_executions',
          ],
        }).save();
      })))
      .then((records) => {
        this.set('entityRecords.space', records);
        return records;
      });
  },

  /**
   * @param {Service} store
   * @returns {Promise<Array<Model>>}
   */
  createTransferRecords(store) {
    const timestamp = getCurrentTimestamp();
    const waitingStateIndex = transferStates.indexOf('waiting');
    const ongoingStateIndex = transferStates.indexOf('ongoing');
    const endedStateIndex = transferStates.indexOf('ended');
    return allFulfilled(transferStates.map((state, stateIndex) => {
        const transfersGroup = allFulfilled(_.range(numberOfTransfers).map(
          i => {
            const scheduleTime = stateIndex >= waitingStateIndex ?
              timestamp + i * 3600 : null;
            const startTime = stateIndex >= ongoingStateIndex ?
              timestamp + (i + 1) * 3600 : null;
            const finishTime = stateIndex >= endedStateIndex ?
              timestamp + (i + 2) * 3600 : null;
            const entityId = generateTransferEntityId(
              i,
              stateIndex,
              scheduleTime,
              finishTime
            );
            return store.createRecord('transfer', {
              id: gri({
                entityType: transferEntityType,
                entityId,
                aspect: 'instance',
                scope: 'private',
              }),
              dataSourceName: `/some/path/file-${i}`,
              dataSourceType: 'dir',
              queryParams: 'hello=1,world=2',
              scheduleTime,
              startTime,
              finishTime,
              // this will be set in main function to use generated records
              // dataSourceId,
              // user,
              // replicatingProvider
            }).save();
          }));
        this.get('allTransfers')[state] = transfersGroup;
        return transfersGroup;
      }))
      .then(transfers => _.flatten(transfers))
      .then((records) => {
        this.set('entityRecords.transfer', records);
        return records;
      });
  },

  // TODO: space provider / provider space lists method can be unified

  createSpaceProviderLists(providerList, spaceList) {
    const store = this.get('store');
    return allFulfilled(spaceList.map(space => {
      return this.createListRecord(store, 'provider', providerList).then(
        listRecord => {
          space.set('providerList', listRecord);
          return space.save();
        });
    }));
  },

  pushProviderListIntoSpaces(listRecords) {
    const providersPromise = listRecords.provider.get('list');
    const spacesPromise = listRecords.space.get('list');
    return allFulfilled([providersPromise, spacesPromise])
      .then(([providerList, spaceList]) =>
        this.createSpaceProviderLists(providerList, spaceList)
      );
  },

  createProviderSpaceLists(providerList, spaceList) {
    const store = this.get('store');
    return allFulfilled(providerList.map(provider => {
      return this.createListRecord(store, 'space', spaceList).then(
        listRecord => {
          provider.set('spaceList', listRecord);
          return provider.save();
        });
    }));
  },

  pushSpaceListIntoProviders(listRecords) {
    const providersPromise = listRecords.provider.get('list');
    const spacesPromise = listRecords.space.get('list');
    return allFulfilled([providersPromise, spacesPromise])
      .then(([providerList, spaceList]) =>
        this.createProviderSpaceLists(providerList, spaceList)
      );
  },

  providerRecordData({ entityId, name, longitude, latitude, scope = 'private' }) {
    return {
      id: gri({
        entityType: providerEntityType,
        entityId,
        aspect: 'instance',
        scope,
      }),
      name,
      latitude,
      longitude,
      online: true,
    };
  },

  async createDataset(file, data = {}) {
    const spaceId = this.get('entityRecords.space.firstObject.entityId');
    const fileId = get(file, 'entityId');
    return this.get('store').createRecord('dataset', Object.assign({
      id: `${datasetEntityType}.${fileId}-dataset.instance:private`,
      index: `${get(file, 'name')}${fileId}`,
      rootFile: file,
      parent: null,
      state: 'attached',
      protectionFlags: [],
      effProtectionFlags: [],
      creationTime: getCurrentTimestamp(),
      rootFilePath: stringifyFilePath(await resolveFilePath(file)),
      rootFileType: get(file, 'type'),
      archiveCount: 0,
      spaceId,
    }, data)).save();
  },

  async createDatasetSummary(file, dataset, data = {}) {
    return this.get('store').createRecord('file-dataset-summary', Object.assign({
      id: `${fileEntityType}.${get(file, 'entityId')}.${datasetSummaryAspect}:private`,
      directDataset: dataset,
      effAncestorDatasets: [],
      effProtectionFlags: get(dataset, 'state') === 'attached' ?
        (get(file, 'effProtectionFlags') || []) : [],
    }, data)).save();
  },

  async createDatasetMock( /* store */ ) {
    const count = 4;
    const ancestorFiles = [
      this.get('entityRecords.dir.firstObject'),
      ...this.get('entityRecords.chainDir').slice(0, count - 1),
    ];
    this.set('entityRecords.dataset', []);
    const datasets = [];
    const summaries = [];
    // create datasets and dataset summaries for few chain dirs
    for (let i = 0; i < ancestorFiles.length; ++i) {
      const ancestorFile = ancestorFiles[i];
      const effProtectionFlags = effProtectionFlagSets[Math.min(i, 2)];
      const ancestorDataset = await this.createDataset(ancestorFile, {
        parent: datasets[i - 1] || null,
        protectionFlags: protectionFlagSets[i % protectionFlagSets.length],
        effProtectionFlags,
      });
      datasets[i] = ancestorDataset;
      // effProtectionFlags must be set before createDatasetSummary
      setProperties(ancestorFile, {
        effDatasetMembership: 'direct',
        effProtectionFlags: effProtectionFlags,
      });
      const datasetSummary = await this.createDatasetSummary(
        ancestorFile,
        ancestorDataset, {
          effAncestorDatasets: datasets.slice(0, i),
        }
      );
      // fileDatasetSummary must be set after createDatasetSummary
      set(ancestorFile, 'fileDatasetSummary', datasetSummary);
      summaries[i] = datasetSummary;
      this.get('entityRecords.fileDatasetSummary').push(...summaries);
      await ancestorFile.save();
    }
    this.get('entityRecords.dataset').push(...datasets);

    // for testing empty data write protected directories
    const emptyDir = this.get('entityRecords.dir.1');
    const emptyDirProtection = Object.freeze(['data_protection']);
    setProperties(emptyDir, {
      effProtectionFlags: emptyDirProtection,
      effDatasetMembership: 'direct',
    });
    await emptyDir.save();
    const emptyDirDataset = await this.createDataset(emptyDir, {
      parent: null,
      protectionFlags: emptyDirProtection,
      effProtectionFlags: emptyDirProtection,
    });
    const emptyDirDatasetSummary =
      await this.createDatasetSummary(emptyDir, emptyDirDataset);
    this.get('entityRecords.dataset').push(emptyDirDataset);
    this.get('entityRecords.fileDatasetSummary').push(emptyDirDatasetSummary);

    // add datasets for some files
    // NOTE: this mock is only for some tests - ancestor-type datasets on files
    // are fake
    const files = this.get('entityRecords.file');
    for (let i = 2; i <= 5; ++i) {
      const file = files[i];
      let effProtectionFlags;
      const effDatasetMembership = i >= 3 && i <= 5 && 'direct' ||
        i >= 2 && i <= 6 && 'directAndAncestor' ||
        'none';
      if (i === 2) {
        effProtectionFlags = ['data_protection'];
      } else if (i === 3) {
        effProtectionFlags = ['metadata_protection'];
      } else if (i === 4) {
        effProtectionFlags = ['data_protection', 'metadata_protection'];
      } else {
        effProtectionFlags = [];
      }
      setProperties(file, {
        effDatasetMembership,
        effProtectionFlags,
      });
      if (
        effDatasetMembership === 'direct' ||
        effDatasetMembership === 'directAndAncestor'
      ) {
        const dataset = await this.createDataset(file, {
          parent: null,
          protectionFlags: protectionFlagSets[i % protectionFlagSets.length],
          effProtectionFlags,
        });
        const fileDatasetSummary = await this.createDatasetSummary(file, dataset);
        setProperties(file, {
          fileDatasetSummary,
        });
        this.get('entityRecords.dataset').push(dataset);
        this.get('entityRecords.fileDatasetSummary').push(fileDatasetSummary);
      }
      await file.save();
    }

    await this.addDetachedDatasetMock();
  },

  async addDetachedDatasetMock() {
    for (const fileDetached of this.get('entityRecords.file').slice(6, 8)) {
      const detachedDataset = await this.createDataset(fileDetached, {
        parent: null,
        state: 'detached',
        protectionFlags: ['metadata_protection'],
        effProtectionFlags: [],
        rootFileDeleted: true,
      });
      const fileDetachedDatasetSummary =
        await this.createDatasetSummary(fileDetached, detachedDataset);
      setProperties(fileDetached, {
        fileDatasetSummary: fileDetachedDatasetSummary,
      });
      this.get('entityRecords.dataset').push(detachedDataset);
      this.get('entityRecords.fileDatasetSummary').push(fileDetachedDatasetSummary);
    }
  },

  async createArchivesMock( /* store */ ) {
    const entityRecordsArchives = this.set('entityRecords.archive', []);
    const datasets = this.get('entityRecords.dataset');
    const dirDataset = datasets.find(ds => get(ds, 'rootFileType') === 'dir');
    await this.createArchivesForDataset(dirDataset, 100);
    await this.setBaseArchive(
      entityRecordsArchives[2],
      entityRecordsArchives[90]
    );
    await this.addArchiveDip(entityRecordsArchives[3]);
    const chainDirDataset = datasets.find(ds =>
      get(ds, 'rootFileType') === 'dir' && ds.belongsTo('parent').id()
    );
    if (chainDirDataset) {
      await this.createArchivesForDataset(chainDirDataset, 5);
    }
    const fileDataset = datasets.find(ds => get(ds, 'rootFileType') === 'file');
    await this.createArchivesForDataset(fileDataset, 1);
  },

  async createArchivesForDataset(dataset, archiveCount) {
    const entityRecordsArchives = this.get('entityRecords.archive');
    const archiveManager = this.get('archiveManager');
    const datasetRootFile = await get(dataset, 'rootFile');
    const name = get(datasetRootFile, 'name');
    for (let i = 0; i < archiveCount; ++i) {
      const archiveEntityId = `${get(dataset, 'entityId')}-archive-${i}`;
      const rootDir = await this.createArchiveRootDir(
        archiveEntityId,
        get(datasetRootFile, 'entityId'),
      );
      const archive = await archiveManager.createArchive(dataset, {
        config: {
          incremental: {
            enabled: false,
          },
          layout: (i >= 2 && i <= 3) ? 'bagit' : 'plain',
          includeDip: false,
        },
        description: `My archive number ${i}`,
        preservedCallback: 'http://example.com/preserved',
        purgedCallback: 'http://example.com/purged',
        dataset,
        // properties not normally used when create
        id: gri({
          entityType: archiveEntityType,
          entityId: archiveEntityId,
          aspect: 'instance',
          scope: 'private',
        }),
        index: name + archiveEntityId,
        creationTime: getCurrentTimestamp(),
        state: 'preserved',
        stats: {
          bytesArchived: (i + 1) * 5678990000,
          filesArchived: (i + 1) * 43,
          failedFiles: 0,
        },
        relatedAip: null,
        relatedDip: null,
        rootDir,
        baseArchive: null,
      });
      entityRecordsArchives.push(archive);
    }
    dataset.set('archiveCount', archiveCount);
    await dataset.save();
  },

  async setBaseArchive(archive, baseArchive) {
    const configWithIncremental = Object.assign({}, get(archive, 'config'));
    configWithIncremental.incremental = {
      enabled: true,
      basedOn: get(baseArchive, 'entityId'),
    };
    setProperties(archive, {
      config: configWithIncremental,
      baseArchive,
    });
    await archive.save();
  },

  async addArchiveDip(archive) {
    const configDip = Object.assign({}, get(archive, 'includeDip'));
    configDip.includeDip = true;
    const dipArchiveEntityId = get(archive, 'entityId') + '-dip';
    const dipArchive = this.get('store').createRecord('archive', {
      config: configDip,
      description: get(archive, 'description') + ' (DIP)',
      preservedCallback: get(archive, 'preservedCallback'),
      purgedCallback: get(archive, 'purgedCallback'),
      dataset: get(archive, 'dataset'),
      relatedAip: archive,
      relatedDip: null,
      // properties not normally used when create
      id: gri({
        entityType: archiveEntityType,
        entityId: dipArchiveEntityId,
        aspect: 'instance',
        scope: 'private',
      }),
      index: get(archive, 'index') + '-dip',
      creationTime: get(archive, 'creationTime'),
      state: get(archive, 'state'),
      stats: get(archive, 'stats'),
      rootDir: get(archive, 'rootDir'),
      baseArchive: get(archive, 'baseArchive'),
    });
    await dipArchive.save();
    setProperties(archive, {
      config: configDip,
      relatedDip: dipArchive,
    });
    await archive.save();
    return dipArchive;
  },

  async createArchiveRootDir(archiveId, fileId) {
    const store = this.get('store');
    const owner = this.get('entityRecords.owner.0');
    const timestamp = getCurrentTimestamp();
    const provider = this.get('entityRecords.provider.firstObject');
    const fileQosSummary = this.get('entityRecords.fileQosSummary.firstObject');
    const emptyDatasetSummary = this.get('entityRecords.fileDatasetSummary.firstObject');
    const entityId = generateDirEntityId(
      0,
      'archive',
      `-archive-${archiveId}-file-${fileId}`
    );
    const id = generateFileGri(entityId);
    const name =
      `archive_${archiveId}`;
    // NOTE: this is not the same structure as in backend, because in backend there is
    // also: space_archives_root and dataset_dir
    // For simplicity we don't implement full structure, so be sure that archives code
    // works on backend.
    const archiveDir = await store.createRecord('file', {
      id,
      name,
      index: name,
      type: 'dir',
      mtime: timestamp,
      posixPermissions: '777',
      owner,
      fileQosSummary,
      emptyDatasetSummary,
      provider,
    }).save();
    const entityRecords = this.get('entityRecords');
    if (!get(entityRecords, 'archiveDir')) {
      set(entityRecords, 'archiveDir', []);
    }
    get(entityRecords, 'archiveDir').push(archiveDir);
    return archiveDir;
  },

  createProviderRecords(store, names) {
    return allFulfilled(_.range(numberOfProviders).map((i) => {
      const [latitude, longitude] = getCoordinates(i, numberOfProviders);
      const entityId = (i === 0 ?
        mockGuiContext.clusterId :
        `${i}ab98a7ba6b7a6ba8b6a7b5a8b6a78b5a78ba578ba587`
      );
      return allFulfilled(['private', 'protected'].map(scope =>
        store.createRecord('provider', this.providerRecordData({
          entityId,
          name: names[i],
          longitude,
          latitude,
          scope,
        })).save()
      )).then(([privateRecord /*, protectedRecord */ ]) => privateRecord);
    })).then((records) => {
      this.set('entityRecords.provider', records);
      return this.createFileDistribution(store).then(() => records);
    });
  },

  createHandleServiceRecords(store) {
    return allFulfilled(['EOSC-hub B2HANDLE Service', 'Oxford University'].map(name => {
      return store.createRecord('handle-service', {
        name,
      }).save();
    })).then(records => {
      this.set('entityRecords.handleService', records);
      return records;
    });
  },

  async createRecallState(store) {
    const archive = this.get('entityRecords.archive.0');
    const chainDirs = this.get('entityRecords.chainDir');
    const chainRootDir = await get(chainDirs[0], 'parent');
    const chainDirId = get(chainRootDir, 'entityId');
    const infoGri = gri({
      entityType: fileEntityType,
      entityId: chainDirId,
      aspect: archiveRecallInfoAspect,
    });
    const stateGri = gri({
      entityType: fileEntityType,
      entityId: chainDirId,
      aspect: archiveRecallStateAspect,
    });
    const archiveRecallInfo = store.createRecord('archive-recall-info', {
      id: infoGri,
      archive,
      dataset: await get(archive, 'dataset'),
      totalFileCount: 100,
      totalByteSize: 1000000,
      startTime: null,
      finishTime: null,
    });
    const archiveRecallState = store.createRecord('archive-recall-state', {
      id: stateGri,
      filesCopied: 50,
      bytesCopied: 500000,
      filesFailed: 0,
      lastError: null,
      // // -- uncomment for real parsable error
      // lastError: {
      //   reason: {
      //     id: 'posix',
      //     details: { errno: 'enospc' },
      //   },
      // },
      // // -- uncomment for unparsable error
      // lastError: {
      //   reason: {
      //     id: 'random',
      //   },
      // },
    });
    this.set('entityRecords.archiveRecallInfo', [archiveRecallInfo]);
    this.set('entityRecords.archiveRecallState', [archiveRecallState]);
    await archiveRecallInfo.save();
    await allFulfilled([chainRootDir, ...chainDirs].map(dir => {
      set(dir, 'recallRootId', chainDirId);
      set(dir, 'archiveRecallInfo', archiveRecallInfo);
      set(dir, 'archiveRecallState', archiveRecallState);
      return dir.save();
    }));
    this.updateRecallState();
    return archiveRecallInfo;
  },

  async updateRecallState() {
    const stepsCount = 1000;
    const archiveRecallInfo = this.get('entityRecords.archiveRecallInfo.0');
    const archiveRecallState = this.get('entityRecords.archiveRecallState.0');
    const {
      startTime,
      finishTime,
      totalFileCount,
      totalByteSize,
    } = getProperties(
      archiveRecallInfo,
      'startTime',
      'finishTime',
      'totalFileCount',
      'totalByteSize',
    );
    if (finishTime) {
      return;
    }

    let infoModified = false;
    let {
      bytesCopied,
      filesCopied,
    } = getProperties(
      archiveRecallState,
      'bytesCopied',
      'filesCopied',
    );
    if (!startTime) {
      set(archiveRecallInfo, 'startTime', Date.now());
      infoModified = true;
    }
    if (bytesCopied < totalByteSize) {
      const filesIncrement = Math.floor(totalFileCount / stepsCount);
      const bytesIncrement = Math.floor(totalByteSize / stepsCount);
      filesCopied = Math.min(totalFileCount, filesCopied + filesIncrement);
      bytesCopied = Math.min(totalByteSize, bytesCopied + bytesIncrement);
    }
    setProperties(archiveRecallState, {
      bytesCopied,
      filesCopied,
    });

    const savePromises = [];
    const finished = bytesCopied >= totalByteSize || filesCopied >= totalFileCount;
    if (finished) {
      // just to be certain
      filesCopied = totalFileCount;
      bytesCopied = totalByteSize;
      set(archiveRecallInfo, 'finishTime', Date.now());
      infoModified = true;
    }
    setProperties(archiveRecallState, {
      bytesCopied,
      filesCopied,
    });
    if (infoModified) {
      savePromises.push(archiveRecallInfo.save());
    }
    savePromises.push(archiveRecallState.save());
    await allFulfilled(savePromises);
    console.debug(
      `service:mock-backend: recall state changed (${get(archiveRecallState, 'entityId')})`
    );
    if (!finished) {
      window.setTimeout(() => this.updateRecallState(), 2000);
    }
  },

  createFileRecords(store, parent, owner) {
    const timestamp = getCurrentTimestamp();
    const parentEntityId = get(parent, 'entityId');
    const provider = this.get('entityRecords.provider.firstObject');
    const fileQosSummary = this.get('entityRecords.fileQosSummary.firstObject');
    const emptyDatasetSummary = this.get('entityRecords.fileDatasetSummary.firstObject');
    const distribution = this.get('entityRecords.fileDistribution.firstObject');
    return allFulfilled(_.range(numberOfDirs).map((i) => {
        const entityId = generateDirEntityId(i, parentEntityId);
        const id = generateFileGri(entityId);
        const name =
          `Directory with very very very long name ${String(i).padStart(4, '0')}`;
        return store.createRecord('file', {
          id,
          name,
          index: name,
          type: 'dir',
          mtime: timestamp + i * 3600,
          hardlinksCount: 1,
          posixPermissions: '777',
          parent,
          owner,
          fileQosSummary,
          fileDatasetSummary: emptyDatasetSummary,
          provider,
        }).save();
      }))
      .then(dirs => {
        this.set('entityRecords.dir', dirs);
        const [firstDir] = dirs;
        if (numberOfDirs > 0) {
          allFulfilled(_.range(numberOfChainDirs).map((i) => {
            const entityId = generateDirEntityId(
              0,
              parentEntityId,
              `-c${String(i).padStart(4, '0')}`
            );
            const id = generateFileGri(entityId);
            const name =
              `Chain directory ${String(i).padStart(4, '0')}`;
            return store.createRecord('file', {
              id,
              name,
              index: name,
              type: 'dir',
              mtime: timestamp + i * 3600,
              posixPermissions: '777',
              owner,
              fileQosSummary,
              emptyDatasetSummary,
              provider,
            }).save();
          })).then(chainDirs => {
            this.set('entityRecords.chainDir', chainDirs);
            const saves = [];
            set(chainDirs[0], 'parent', firstDir);
            saves.push(chainDirs[0].save());
            for (let i = 1; i < chainDirs.length; ++i) {
              set(chainDirs[i], 'parent', chainDirs[i - 1]);
              saves.push(chainDirs[i].save());
            }
            return allFulfilled(saves);
          });
        }
      })
      .then(() => allFulfilled(_.range(numberOfFiles).map((i) => {
        const isSymlink = i % 10 === 9;
        const entityId = generateFileEntityId(i, parentEntityId);
        const id = generateFileGri(entityId);
        const name = `file-${String(i).padStart(4, '0')}`;
        const effQosMembership = i > 3 && i < 8 && 'direct' ||
          i > 6 && i < 10 && 'ancestor' ||
          'none';
        return store.createRecord('file', {
          id,
          name,
          index: name,
          type: isSymlink ? 'symlink' : 'file',
          posixPermissions: (i > 10 && i < 12 && !isSymlink) ? '333' : '777',
          hasMetadata: i < 5,
          effQosMembership,
          effDatasetMembership: 'none',
          effProtectionFlags: [],
          size: isSymlink ? 20 : i * 1000000,
          mtime: timestamp + i * 3600,
          hardlinksCount: i % 5 === 0 ? 2 : 1,
          parent,
          owner,
          distribution: isSymlink ? undefined : distribution,
          fileQosSummary: isSymlink ? undefined : fileQosSummary,
          fileDatasetSummary: isSymlink ? undefined : emptyDatasetSummary,
          provider,
          targetPath: isSymlink ? '../some/file' : undefined,
        }).save();
      })))
      .then(async (records) => {
        this.set('entityRecords.file', records);
        const symlinks = records.filterBy('type', 'symlink');
        const symlinkMap = symlinks.reduce((map, symlink) => {
          const symlinkTarget = records[records.indexOf(symlink) - 1];
          map[get(symlink, 'entityId')] = get(symlinkTarget, 'entityId');
          return map;
        }, {});
        this.set('symlinkMap', symlinkMap);
        const dirs = this.get('entityRecords.dir');
        if (dirs.length > 4) {
          const symlinkDir = dirs[3];
          const targetDir = dirs[4];
          await this.symlinkizeDirectory(symlinkDir, targetDir);
        }
        return this.makeFilesConflict().then(() => records);
      });
  },

  /**
   * Method for mocking adding some files between directories and files.
   * Should be launched manually and after it resolves,
   * `onedataGraph.clearChildrenCache()` should be launched.
   * @param {Number} count
   * @return {Promise}
   */
  async addFrontFiles(count = 10) {
    const store = this.get('store');
    const parent = this.get('entityRecords.spaceRootDir.firstObject');
    const parentEntityId = get(parent, 'entityId');
    const promises = _.range(0, count).map(i => {
      const name = `A-${String(i).padStart(4, '0')}`;
      const entityId = btoa(`${parentEntityId}-${name}`);
      const id = generateFileGri(entityId);
      return store.createRecord('file', this.createFileData({
        id,
        name,
        index: name,
        parent,
      })).save();
    });
    const frontFiles = await allFulfilled(promises);
    const globalFiles = this.get('entityRecords.file');
    globalFiles.unshift(...frontFiles);
    return frontFiles;
  },

  createFileData(customData) {
    const timestamp = getCurrentTimestamp();
    const provider = this.get('entityRecords.provider.firstObject');
    const fileQosSummary = this.get('entityRecords.fileQosSummary.firstObject');
    const emptyDatasetSummary = this.get('entityRecords.fileDatasetSummary.firstObject');
    const distribution = this.get('entityRecords.fileDistribution.firstObject');
    const owner = this.get('entityRecords.owner.firstObject');
    return Object.assign({
      type: 'file',
      posixPermissions: '777',
      hasMetadata: false,
      effQosMembership: 'none',
      effDatasetMembership: 'none',
      effProtectionFlags: [],
      size: 1024 * 1024,
      mtime: timestamp,
      hardlinksCount: 0,
      distribution: distribution,
      fileQosSummary: fileQosSummary,
      fileDatasetSummary: emptyDatasetSummary,
      provider,
      targetPath: undefined,
      owner,
    }, customData);
  },

  async createAtmInventoryRecords(store, names) {
    const atmInventories = [];
    const atmWorkflowSchemas = [];
    for (const name of names) {
      const atmInventory = await store.createRecord('atmInventory', {
        name,
      }).save();

      const inventoryAtmWorkflowSchemas = [];
      for (const idx of [0, 1, 2]) {
        const atmWorkflowSchema = await store.createRecord('atmWorkflowSchema', {
          id: gri({
            entityType: atmWorkflowSchemaEntityType,
            entityId: `workflowSchema${get(atmInventory, 'entityId')}-${idx}`,
            aspect: 'instance',
            scope: 'private',
          }),
          name: `workflow ${idx} [${name}]`,
          summary: `workflow ${idx} summary`,
          revisionRegistry: {
            1: {
              description: `workflow ${idx} description`,
              state: 'stable',
              stores: [{
                id: 'store1',
                name: 'list of integers',
                type: 'list',
                dataSpec: {
                  type: 'integer',
                  valueConstraints: {},
                },
                requiresInitialValue: true,
                defaultInitialValue: [1, 2, 3],
              }, {
                id: 'store2',
                name: 'single value file',
                type: 'singleValue',
                dataSpec: {
                  type: 'file',
                  valueConstraints: {
                    fileType: 'ANY',
                  },
                },
                requiresInitialValue: true,
              }],
              lanes: [{
                id: 'lane1',
                name: 'lane 1',
                maxRetries: 3,
                storeIteratorSpec: {
                  storeSchemaId: 'store1',
                  maxBatchSize: 100,
                },
                parallelBoxes: [{
                  id: 'pbox1-1',
                  name: 'Parallel box',
                  tasks: [{
                    id: 'task1-1-1',
                    name: 'task1',
                    lambdaId: 'lambda1',
                    lambdaRevisionNumber: 1,
                    argumentMappings: [],
                    resultMappings: [],
                  }],
                }],
              }],
            },
          },
        }).save();
        inventoryAtmWorkflowSchemas.push(atmWorkflowSchema);
      }
      const atmWorkflowSchemaList = await this.createListRecord(
        store,
        'atmWorkflowSchema',
        inventoryAtmWorkflowSchemas
      );

      set(atmInventory, 'atmWorkflowSchemaList', atmWorkflowSchemaList);
      await atmInventory.save();
      atmInventories.push(atmInventory);
      atmWorkflowSchemas.push(...inventoryAtmWorkflowSchemas);
    }

    this.set('entityRecords.atmInventory', atmInventories);
    this.set('entityRecords.atmWorkflowSchema', atmWorkflowSchemas);
    return atmInventories;
  },

  /**
   * @param {Service} store
   * @returns {Promise<Array<Model>>}
   */
  async createAtmWorkflowExecutionRecords(store) {
    const space = this.get('entityRecords.space.0');
    const atmInventories = this.get('entityRecords.atmInventory');
    const atmWorkflowSchemas = this.get('entityRecords.atmWorkflowSchema');
    const atmWorkflowSchemasCount = get(atmWorkflowSchemas, 'length');
    const timestamp = getCurrentTimestamp();
    const waitingPhaseIndex = atmWorkflowExecutionPhases.indexOf('waiting');
    const ongoingPhaseIndex = atmWorkflowExecutionPhases.indexOf('ongoing');
    const endedPhaseIndex = atmWorkflowExecutionPhases.indexOf('ended');

    const atmWorkflowExecutions = [];
    const atmWorkflowExecutionSummaries = [];
    for (const phase of atmWorkflowExecutionPhases) {
      const phaseIndex = atmWorkflowExecutionPhases.indexOf(phase);
      const executionsGroup = await allFulfilled(
        _.range(numberOfAtmWorkflowExecutions).map(async (i) => {
          const atmInventory = atmInventories[i % atmInventories.length];
          const scheduleTime = phaseIndex >= waitingPhaseIndex ?
            timestamp + i * 3600 : null;
          const startTime = phaseIndex >= ongoingPhaseIndex ?
            timestamp + (i + 1) * 3600 : null;
          const finishTime = phaseIndex >= endedPhaseIndex ?
            timestamp + (i + 2) * 3600 : null;
          const entityId = generateAtmWorkflowExecutionEntityId(
            i,
            phaseIndex,
            scheduleTime,
            finishTime
          );
          const atmWorkflowSchema = atmWorkflowSchemas[i % atmWorkflowSchemasCount];
          const revision = get(atmWorkflowSchema, 'revisionRegistry.1');
          const lanes = revision.lanes;
          const atmWorkflowSchemaSnapshot = await store.createRecord(
            'atmWorkflowSchemaSnapshot',
            Object.assign(getProperties(
              atmWorkflowSchema,
              'name',
              'summary',
            ), { revisionRegistry: { 1: revision } })
          ).save();
          const storeRegistry = get(revision, 'stores').reduce(
            (registry, store) => {
              const storeId = get(store, 'id');
              registry[storeId] = `${storeId}instance`;
              return registry;
            }, {}
          );
          const executionLanes = [];
          if (i < 5) {
            for (const lane of lanes) {
              const executionLane = {
                schemaId: lane.id,
                runs: [],
              };
              const runsCount = 11;
              const statusesPerRun = [
                ..._.times(runsCount - 1, (idx) => [idx + 1, 'failed']),
                [runsCount, 'active'],
              ];
              const storeIdFromSpec = storeRegistry[lane.storeIteratorSpec.storeSchemaId];
              const exceptionStoresPerRun = {};
              for (const [runNumber, status] of statusesPerRun) {
                const exceptionStoreId = `exception-${phase}-${i}-${lane.id}-${runNumber}`;
                exceptionStoresPerRun[runNumber] =
                  await this.createAtmStore(exceptionStoreId, {
                    type: 'list',
                    dataSpec: { type: 'object' },
                  });
                const prevRunExceptionStoreId =
                  runNumber > 1 && get(exceptionStoresPerRun[runNumber - 1], 'entityId');
                const isRerun = runNumber % 5 == 0;
                const run = {
                  runNumber,
                  originRunNumber: runNumber === 1 ? null : (isRerun ? 1 : runNumber - 1),
                  runType: runNumber === 1 ? 'regular' : (isRerun ? 'rerun' : 'retry'),
                  iteratedStoreId: runNumber === 1 || isRerun ?
                    storeIdFromSpec : prevRunExceptionStoreId,
                  exceptionStoreId,
                  isRetriable: status === 'failed',
                  isRerunable: true,
                  status,
                  parallelBoxes: [],
                };
                for (const parallelBox of lane.parallelBoxes) {
                  const executionParallelBox = {
                    schemaId: parallelBox.id,
                    status,
                    taskRegistry: {},
                  };
                  for (let taskIdx = 0; taskIdx < parallelBox.tasks.length; taskIdx++) {
                    const task = parallelBox.tasks[taskIdx];
                    const taskEntityId =
                      generateAtmTaskExecutionEntityId(taskIdx, entityId, runNumber);
                    const systemAuditLogId = `auditLog-task-${taskEntityId}`;
                    await this.createAtmStore(systemAuditLogId, {
                      type: 'auditLog',
                      dataSpec: { type: 'object' },
                    });
                    const executionTaskRecord = await store.createRecord('atmTaskExecution', {
                      id: gri({
                        entityType: atmTaskExecutionEntityType,
                        entityId: taskEntityId,
                        aspect: 'instance',
                        scope: 'private',
                      }),
                      schemaId: task.id,
                      systemAuditLogId,
                      status,
                      itemsInProcessing: runNumber * 10,
                      itemsProcessed: runNumber * 5,
                      itemsFailed: runNumber * 2,
                    }).save();
                    executionParallelBox.taskRegistry[task.id] =
                      get(executionTaskRecord, 'entityId');
                  }
                  run.parallelBoxes.push(executionParallelBox);
                }
                executionLane.runs.push(run);
              }
              // simulate prepare in advance
              Object.assign(executionLane.runs[executionLane.runs.length - 1], {
                runNumber: null,
                originRunNumber: null,
              });
              executionLanes.push(executionLane);
            }
          }
          const systemAuditLogId = `auditLog-workflow-${entityId}`;
          await this.createAtmStore(systemAuditLogId, {
            type: 'auditLog',
            dataSpec: { type: 'object' },
          });
          const atmWorkflowExecution = await store.createRecord('atmWorkflowExecution', {
            id: gri({
              entityType: atmWorkflowExecutionEntityType,
              entityId,
              aspect: 'instance',
              scope: 'private',
            }),
            status: atmWorkflowExecutionStatusForPhase[phase],
            storeRegistry,
            systemAuditLogId,
            lanes: executionLanes,
            scheduleTime,
            startTime,
            finishTime,
            atmWorkflowSchemaSnapshot,
            space,
          }).save();
          atmWorkflowExecutions.push(atmWorkflowExecution);
          return await store.createRecord('atmWorkflowExecutionSummary', {
            id: gri({
              entityType: atmWorkflowExecutionEntityType,
              entityId,
              aspect: 'summary',
              scope: 'protected',
            }),
            name: get(atmWorkflowSchema, 'name'),
            status: atmWorkflowExecutionStatusForPhase[phase],
            scheduleTime,
            startTime,
            finishTime,
            atmWorkflowExecution,
            atmInventory,
          }).save();
        })
      );
      this.get('allAtmWorkflowExecutionSummaries')[phase] = executionsGroup;
      atmWorkflowExecutionSummaries.push(...executionsGroup);
    }
    this.set('entityRecords.atmWorkflowExecution', atmWorkflowExecutions);
    this.set('entityRecords.atmWorkflowExecutionSummary', atmWorkflowExecutionSummaries);
    return atmWorkflowExecutions;
  },

  async createAtmStore(atmStoreEntityId, data) {
    const id = gri({
      entityType: atmStoreEntityType,
      entityId: atmStoreEntityId,
      aspect: 'instance',
      scope: 'private',
    });
    return await this.get('store')
      .createRecord('atmStore', Object.assign({ id }, data))
      .save();
  },

  createEntityRecords(store, type, names, additionalInfo) {
    let createPromise;
    switch (type) {
      case 'space':
        createPromise = this.createSpaceRecords(store, names, additionalInfo);
        break;
      case 'provider':
        createPromise = this.createProviderRecords(store, names, additionalInfo);
        break;
      case 'handleService':
        createPromise = this.createHandleServiceRecords(store);
        break;
      case 'atmInventory':
        createPromise = this.createAtmInventoryRecords(store, names);
        break;
      default:
        createPromise = allFulfilled(names.map(name =>
          store.createRecord(type, { name }).save()
        ));
        break;
    }
    return createPromise;
  },

  createUserRecord(store, listRecords) {
    const userRecord = store.createRecord('user', {
      id: store.userGri(userEntityId),
      fullName,
      username,
    });
    Object.values(listRecords).forEach(lr =>
      userRecord.set(camelize('eff-' + lr.constructor.modelName), lr)
    );
    return userRecord.save();
  },
});

export function generateFileEntityId(i, parentEntityId) {
  return btoa(`${parentEntityId}-file-${String(i).padStart(4, '0')}`);
}

export function generateDirEntityId(i, parentEntityId, suffix = '') {
  const internalFileId = `${parentEntityId}-dir-${String(i).padStart(4, '0')}${suffix}`;
  return btoa(`guid#${internalFileId}#${generateSpaceEntityId(0)}`);
}

export function parseDecodedDirEntityId(entityId) {
  const [, internalFileId, spaceId] = entityId.match(/guid#(.*)#(.*)/);
  return { internalFileId, spaceId };
}

export function generateTransferEntityId(i, state, scheduleTime, startTime) {
  return btoa(`transfer-${state}-${i}-${scheduleTime}-${startTime}`);
}

export function generateAtmWorkflowExecutionEntityId(i, state, scheduleTime, startTime) {
  return btoa(`atmWorkflowExecution-${state}-${i}-${scheduleTime}-${startTime}`);
}

export function generateAtmTaskExecutionEntityId(
  i,
  atmWorkflowExecutionEntityId,
  runNumber
) {
  return btoa(`atmTaskExecution-${atmWorkflowExecutionEntityId}-${i}-${runNumber}`);
}

export function generateFileGri(entityId) {
  return gri({
    entityType: 'file',
    entityId: entityId,
    aspect: 'instance',
    scope: 'private',
  });
}

function addShareList(parentRecord, shares, store, additionalData) {
  const shareList = store.createRecord('shareList');
  return get(shareList, 'list')
    .then(list => {
      list.pushObjects(shares);
      return list.save();
    })
    .then(() => shareList.save())
    .then(() => {
      set(parentRecord, 'shareList', shareList);
      if (additionalData) {
        setProperties(parentRecord, additionalData);
      }
      return parentRecord.save();
    });
}

function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000);
}
