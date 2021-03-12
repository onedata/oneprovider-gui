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
import { get, set, setProperties, computed } from '@ember/object';
import { all as allFulfilled, hash as hashFulfilled, resolve } from 'rsvp';
import gri from 'onedata-gui-websocket-client/utils/gri';
import _ from 'lodash';
import {
  generateSpaceEntityId,
  generateShareEntityId,
  getCoordinates,
} from 'onedata-gui-websocket-client/utils/development-model-common';
import { mockGuiContext } from 'onedata-gui-common/initializers/fetch-gui-context';
import { entityType as providerEntityType } from 'oneprovider-gui/models/provider';
import { entityType as spaceEntityType } from 'oneprovider-gui/models/space';
import { entityType as shareEntityType } from 'oneprovider-gui/models/share';
import { entityType as transferEntityType } from 'oneprovider-gui/models/transfer';
import { entityType as qosEntityType } from 'oneprovider-gui/models/qos-requirement';
import {
  exampleMarkdownLong as exampleMarkdown,
  exampleDublinCore,
} from 'oneprovider-gui/utils/mock-data';

const userEntityId = 'stub_user_id';
const fullName = 'Stub user';
const username = 'admin';

const modelTypes = [
  'provider',
  'space',
  'handleService',
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
};

export const numberOfProviders = 3;
export const numberOfSpaces = 1;
export const numberOfFiles = 200;
export const numberOfDirs = 2;
export const numberOfChainDirs = 5;
export const numberOfTransfers = 150;

export const storageIdAlpha = '90ca74738947307403740234723bca7890678acb5c7bac567b8ac';
export const storageIdBeta = '39a423bbc90437434723bca789ab9ddc8a7abd8b8b8a232731901';

const transferStates = ['waiting', 'ongoing', 'ended'];

export default Service.extend({
  store: service(),

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
   * All entity records of some type.
   * Is an object where key is model name and values are arrays with records.
   * Contains also special collections:
   * - chainDir - files records that are chained directories
   */
  entityRecords: computed(() => ({})),

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
        promiseChain.then(() => hashFulfilled(promiseHash))
      )
      .then((listRecords) => {
        const { space: spaceList } = listRecords;
        return store.createRecord('user', {
          fullName: 'John Smith',
          username: 'smith',
        }).save().then(owner => {
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
      .then(listRecords => this.createUserRecord(store, listRecords))
      .then(user => {
        return user.get('spaceList')
          .then(spaceList => get(spaceList, 'list'))
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
        addShareList(rootFile, [privateShare0, privateShare1], store),
        addShareList(space, [privateShare0, privateShare1], store),
      ]));
  },

  /**
   * @param {Service} store
   * @param {Array<String>} names
   * @returns {Promise<Array<Model>>}
   */
  createSpaceRecords(store, names) {
    const timestamp = Math.floor(Date.now() / 1000);
    const provider = this.get('entityRecords.provider.firstObject');
    const providerId = get(provider, 'entityId');
    const fileQosSummary = this.get('entityRecords.fileQosSummary.firstObject');
    return allFulfilled(_.range(numberOfSpaces).map((i) =>
        // root dirs
        store.createRecord('file', {
          id: generateFileGri(generateDirEntityId(0, '')),
          name: names[i],
          type: 'dir',
          mtime: timestamp + i * 3600,
          hasMetadata: false,
          hasDirectQos: i < 2,
          hasEffQos: i < 4,
          parent: null,
          posixPermissions: '777',
          fileQosSummary,
          provider,
        }).save()
      ))
      .then(rootDirs => allFulfilled(_.range(numberOfSpaces).map((i) =>
        store.createRecord('space', {
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
          // NOTE: add 'space_manager_qos' to see add qos view
          // put empty array to disable qos modal
          currentUserEffPrivileges: [
            'space_view',
            'space_view_qos',
            'space_view_transfers',
          ],
        }).save()
      )))
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
    const timestamp = Math.floor(Date.now() / 1000);
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

  createFileRecords(store, parent, owner) {
    const timestamp = Math.floor(Date.now() / 1000);
    const parentEntityId = get(parent, 'entityId');
    const provider = this.get('entityRecords.provider.firstObject');
    const fileQosSummary = this.get('entityRecords.fileQosSummary.firstObject');
    const distribution = this.get('entityRecords.fileDistribution.firstObject');
    return allFulfilled(_.range(numberOfDirs).map((i) => {
        const entityId = generateDirEntityId(i, parentEntityId);
        const id = generateFileGri(entityId);
        const name =
          `Directory long long long long long long long long long name ${String(i).padStart(4, '0')}`;
        return store.createRecord('file', {
          id,
          name,
          index: name,
          type: 'dir',
          mtime: timestamp + i * 3600,
          posixPermissions: '777',
          parent,
          owner,
          fileQosSummary,
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
              `Chain directory long long long long long name ${String(i).padStart(4, '0')}`;
            return store.createRecord('file', {
              id,
              name,
              index: name,
              type: 'dir',
              mtime: timestamp + i * 3600,
              posixPermissions: '777',
              owner,
              fileQosSummary,
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
        const entityId = generateFileEntityId(i, parentEntityId);
        const id = generateFileGri(entityId);
        const name = `file-${String(i).padStart(4, '0')}`;
        return store.createRecord('file', {
          id,
          name,
          index: name,
          type: 'file',
          posixPermissions: i > 10 && i < 12 ? '333' : '777',
          hasMetadata: i < 5,
          hasEffQos: i > 3 && i < 8,
          hasDirectQos: i > 6 && i < 10,
          size: i * 1000000,
          mtime: timestamp + i * 3600,
          parent,
          owner,
          distribution,
          fileQosSummary,
          provider,
        }).save();
      })))
      .then((records) => {
        this.set('entityRecords.file', records);
        return this.makeFilesConflict().then(() => records);
      });
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
      userRecord.set(camelize(lr.constructor.modelName), lr)
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

export function generateFileGri(entityId) {
  return gri({
    entityType: 'file',
    entityId: entityId,
    aspect: 'instance',
    scope: 'private',
  });
}

function addShareList(parentRecord, shares, store) {
  const shareList = store.createRecord('shareList');
  return get(shareList, 'list')
    .then(list => {
      list.pushObjects(shares);
      return list.save();
    })
    .then(() => shareList.save())
    .then(() => {
      set(parentRecord, 'shareList', shareList);
      return parentRecord.save();
    });
}
