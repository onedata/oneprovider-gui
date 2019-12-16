/**
 * Creates and shares a state of mocked data model
 * 
 * @module services/mock-backend
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { camelize } from '@ember/string';
import { get, set, setProperties, computed } from '@ember/object';
import { all as allFulfilled } from 'rsvp';
import gri from 'onedata-gui-websocket-client/utils/gri';
import _ from 'lodash';
import {
  generateSpaceEntityId,
  getCoordinates,
} from 'onedata-gui-websocket-client/utils/development-model-common';
import { mockGuiContext } from 'onedata-gui-common/initializers/fetch-gui-context';
import { entityType as providerEntityType } from 'oneprovider-gui/models/provider';
import { entityType as spaceEntityType } from 'oneprovider-gui/models/space';
import { entityType as transferEntityType } from 'oneprovider-gui/models/transfer';

const userEntityId = 'stub_user_id';
const fullName = 'Stub user';
const username = 'admin';

const modelTypes = [
  'space',
  'provider',
];

export const recordNames = {
  provider: ['Cracow', 'Paris', 'Lisbon'],
  space: ['One', 'Two', 'Three'],
};

export const defaultRecordNames = ['One', 'Two', 'Three'];

export const numberOfProviders = 3;
export const numberOfSpaces = 1;
export const numberOfFiles = 100;
export const numberOfDirs = 2;
export const numberOfChainDirs = 5;
export const numberOfTransfers = 150;

const tsWaiting = 0;
const tsOngoing = 1;
const tsEnded = 2;

const transferStates = ['waiting', 'ongoing', 'ended'];

export default Service.extend({
  store: service(),

  /**
   * WARNING: Will be initialzed only after generating development model.
   * Will generate: `{ <state>: [], ... }`
   */
  allTransfers: computed(() => transferStates.reduce((obj, state) => {
    obj[state] = [];
    return obj;
  }, {})),

  /**
   * WARNING: Will be initialzed only after generating development model.
   * All entity records of some type.
   * Is an object where key is model name and values are arrays with records.
   */
  entityRecords: computed(() => ({})),

  generateDevelopmentModel() {
    const store = this.get('store');
    return allFulfilled(
        modelTypes.map(type =>
          this.createEntityRecords(store, type, recordNames[type] || defaultRecordNames)
          .then(records => this.createListRecord(store, type, records))
        )
      )
      .then((listRecords) => {
        const [spaceList] = listRecords;
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
                      // currenlty to make it simpler, all files are rootDir
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
      .then(listRecords => this.createUserRecord(store, listRecords))
      .then(user => {
        return user.get('spaceList')
          .then(spaceList => get(spaceList, 'list'))
          .then(list => allFulfilled(list.toArray()))
          .then(spaces => allFulfilled(spaces.map(space => {
            set(space, 'owner', user);
            return space.save();
          })))
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
          parent: null,
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
    return allFulfilled([tsWaiting, tsOngoing, tsEnded].map(stateNum => {
        const transfersGroup = allFulfilled(_.range(numberOfTransfers).map(
          i => {
            const scheduleTime = stateNum >= tsWaiting ?
              timestamp + i * 3600 : null;
            const startTime = stateNum >= tsOngoing ?
              timestamp + (i + 1) * 3600 : null;
            const finishTime = stateNum >= tsEnded ?
              timestamp + (i + 2) * 3600 : null;
            const entityId = generateTransferEntityId(
              i,
              stateNum,
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
        this.get('allTransfers')[transferStates[stateNum]] = transfersGroup;
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
    const providersPromise = listRecords[modelTypes.indexOf('provider')].get('list');
    const spacesPromise = listRecords[modelTypes.indexOf('space')].get('list');
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
    const providersPromise = listRecords[modelTypes.indexOf('provider')].get('list');
    const spacesPromise = listRecords[modelTypes.indexOf('space')].get('list');
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
        return store.createRecord('file', {
          id,
          name: `Directory long long long long long long long long long long long long long long long long name ${String(i).padStart(4, '0')}`,
          index: atob(entityId),
          type: 'dir',
          mtime: timestamp + i * 3600,
          parent,
          owner,
        }).save();
      }))
      .then(([firstDir]) => {
        if (numberOfDirs > 0) {
          allFulfilled(_.range(numberOfChainDirs).map((i) => {
            const entityId = generateDirEntityId(
              0,
              parentEntityId,
              `-c${String(i).padStart(4, '0')}`
            );
            const id = generateFileGri(entityId);
            return store.createRecord('file', {
              id,
              name: `Chain directory long long long long long name ${String(i).padStart(4, '0')}`,
              index: atob(entityId),
              type: 'dir',
              mtime: timestamp + i * 3600,
              owner,
            }).save();
          })).then(chainDirs => {
            let saves = [];
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
        return store.createRecord('file', {
          id,
          name: `file-${String(i).padStart(4, '0')}`,
          index: atob(entityId),
          type: 'file',
          size: i * 1000000,
          mtime: timestamp + i * 3600,
          parent,
          owner,
        }).save();
      })))
      .then((records) => {
        this.set('entityRecords.file', records);
        return records;
      });
  },

  createEntityRecords(store, type, names, additionalInfo) {
    let createPromise;
    switch (type) {
      case 'space':
        createPromise = this.createSpaceRecords(store, names, additionalInfo);
        break;
      case 'provider':
        createPromise = this.createProviderRecords(store, names,
          additionalInfo);
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
    listRecords.forEach(lr =>
      userRecord.set(camelize(lr.constructor.modelName), lr)
    );
    return userRecord.save();
  },
});

export function generateFileEntityId(i, parentEntityId) {
  return btoa(`${parentEntityId}-file-${String(i).padStart(4, '0')}`);
}

export function generateDirEntityId(i, parentEntityId, suffix = '') {
  return btoa(`${parentEntityId}-dir-${String(i).padStart(4, '0')}${suffix}`);
}

export function generateTransferEntityId(i, state, scheduleTime, startTime) {
  let stateName;
  switch (state) {
    case tsOngoing:
      stateName = 'ongoing';
      break;
    case tsWaiting:
      stateName = 'waiting';
      break;
    case tsEnded:
      stateName = 'finished';
      break;
    default:
      break;
  }
  return btoa(`transfer-${stateName}-${i}-${scheduleTime}-${startTime}`);
}

export function decodeTransferEntityId(entityId) {
  const segments = atob(entityId).split('-');
  return {
    i: segments[1],
    state: segments[2],
    startTime: segments[3],
    finishTime: segments[4],
  };
}

export function generateFileGri(entityId) {
  return gri({
    entityType: 'file',
    entityId: entityId,
    aspect: 'instance',
    scope: 'private',
  });
}

export function generateTransferGri(entityId) {
  return gri({
    entityType: transferEntityType,
    entityId: entityId,
    aspect: 'instance',
    scope: 'private',
  });
}
