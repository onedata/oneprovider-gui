/**
 * Creates and shares a state of mocked data model
 * 
 * @module services/mock-backend
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { camelize } from '@ember/string';
import { get, set, setProperties, computed } from '@ember/object';
import { all as allFulfilled, hash as hashFulfilled } from 'rsvp';
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

const userEntityId = 'stub_user_id';
const fullName = 'Stub user';
const username = 'admin';

const modelTypes = [
  'space',
  'provider',
];

export const defaultRecordNames = ['One', 'Two', 'Three'];

export const recordNames = {
  provider: ['Cracow', 'Paris', 'Lisbon'],
  space: defaultRecordNames,
};

export const numberOfProviders = 3;
export const numberOfSpaces = 1;
export const numberOfFiles = 100;
export const numberOfDirs = 2;
export const numberOfChainDirs = 5;
export const numberOfTransfers = 150;

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
    return this.createEmptyQos(store).then(() =>
        hashFulfilled(
          modelTypes.reduce((promiseHash, type) => {
            promiseHash[type] =
              this.createEntityRecords(
                store,
                type,
                recordNames[type] ||
                defaultRecordNames
              )
              .then(records => this.createListRecord(store, type, records));
            return promiseHash;
          }, {})
        )
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

  createEmptyQos(store) {
    return store.createRecord('fileQosSummary', {
      entries: {},
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
    const chainDir = get(entityRecords, 'chainDir')[2];
    const rootDir = get(entityRecords, 'rootDir')[0];
    const qos1Promise = store.createRecord('qosRequirement', {
      id: gri({
        entityType: qosEntityType,
        entityId: 'q1',
        aspect: 'instance',
      }),
      fulfilled: true,
      replicasNum: 7,
      expressionRpn: ['storage_type=dummy', 'speed=178', '|', 'latency=87', '&'],
      file: chainDir,
    }).save();
    const qos2Promise = store.createRecord('qosRequirement', {
      id: gri({
        entityType: qosEntityType,
        entityId: 'q2',
        aspect: 'instance',
      }),
      fulfilled: false,
      replicasNum: 1,
      expressionRpn: ['size=10'],
      file: rootDir,
    }).save();
    return allFulfilled([qos1Promise, qos2Promise]).then(([qos1, qos2]) => {
      return store.createRecord('fileQosSummary', {
        entries: {
          [get(qos1, 'entityId')]: true,
          [get(qos2, 'entityId')]: true,
        },
      }).save();
    }).then(fileQosSummary => {
      set(chainDir, 'fileQos', fileQosSummary);
      return chainDir.save();
    });
  },

  createAndAddShare(store) {
    const entityRecords = this.get('entityRecords');
    const rootFile = get(entityRecords, 'chainDir')[2];
    const space = get(entityRecords, 'space')[0];
    const handle = store.createRecord('handle', {
      url: 'https://example.com/1234',
      metadataString: '<test></test>',
    });
    const shares = ['private', 'public'].map(scope => {
      const entityId = generateShareEntityId(get(space, 'entityId'));
      const publicUrl = location.origin + '/shares/' + entityId;
      return store.createRecord('share', {
        id: gri({
          entityType: shareEntityType,
          entityId,
          aspect: 'instance',
          scope,
        }),
        fileType: 'dir',
        name: 'My Share',
        rootFile,
        privateRootFile: rootFile,
        publicUrl,
        handle,
      });
    });
    return handle.save()
      .then(() => allFulfilled(shares.map(share => share.save())))
      .then(([privateShare]) => allFulfilled([
        addShareList(rootFile, [privateShare], store),
        addShareList(space, [privateShare], store),
      ]));
  },

  /**
   * @param {Service} store 
   * @param {Array<String>} names 
   * @returns {Promise<Array<Model>>}
   */
  createSpaceRecords(store, names) {
    const timestamp = Math.floor(Date.now() / 1000);
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
          fileQos: this.get('entityRecords.fileQosSummary.firstObject'),
          provider: this.get('entityRecords.provider.firstObject'),
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

  createProviderRecords(store, names) {
    return allFulfilled(_.range(numberOfProviders).map((i) => {
        const [latitude, longitude] = getCoordinates(i, numberOfProviders);
        const entityId = (i === 0 ? mockGuiContext.clusterId : `${i}abc1`);
        return store.createRecord('provider', {
          id: gri({
            entityType: providerEntityType,
            entityId,
            aspect: 'instance',
            scope: 'private',
          }),
          name: names[i],
          latitude,
          longitude,
          online: true,
        }).save();
      }))
      .then((records) => {
        this.set('entityRecords.provider', records);
        return records;
      });
  },

  createFileRecords(store, parent, owner) {
    const timestamp = Math.floor(Date.now() / 1000);
    const parentEntityId = get(parent, 'entityId');
    return allFulfilled(_.range(numberOfDirs).map((i) => {
        const entityId = generateDirEntityId(i, parentEntityId);
        const id = generateFileGri(entityId);
        const name =
          `Directory long long long long long long long long long long long long long long long long name ${String(i).padStart(4, '0')}`;
        return store.createRecord('file', {
          id,
          name,
          index: name,
          type: 'dir',
          mtime: timestamp + i * 3600,
          posixPermissions: '777',
          parent,
          owner,
          fileQos: this.get('entityRecords.fileQosSummary.firstObject'),
          provider: this.get('entityRecords.provider.firstObject'),
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
            const name = `Chain directory long long long long long name ${String(i).padStart(4, '0')}`;
            return store.createRecord('file', {
              id,
              name,
              index: name,
              type: 'dir',
              mtime: timestamp + i * 3600,
              posixPermissions: '777',
              owner,
              fileQos: this.get('entityRecords.fileQosSummary.firstObject'),
              provider: this.get('entityRecords.provider.firstObject'),
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
          posixPermissions: '777',
          hasMetadata: i < 5,
          hasEffQos: i > 3 && i < 8,
          hasDirectQos: i > 6 && i < 10,
          size: i * 1000000,
          mtime: timestamp + i * 3600,
          parent,
          owner,
          fileQos: this.get('entityRecords.fileQosSummary.firstObject'),
          provider: this.get('entityRecords.provider.firstObject'),
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
