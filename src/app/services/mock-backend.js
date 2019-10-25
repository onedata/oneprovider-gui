import Service, { inject as service } from '@ember/service';
import { camelize } from '@ember/string';
import { get, set, setProperties, computed } from '@ember/object';
import { all as allFulfilled } from 'rsvp';
import gri from 'onedata-gui-websocket-client/utils/gri';
import _ from 'lodash';
import { generateSpaceEntityId } from 'onedata-gui-websocket-client/utils/development-model-common';

const userEntityId = 'stub_user_id';
const fullName = 'Stub user';
const username = 'admin';

const types = [
  'space',
];

export const names = ['One'];

export const numberOfProviders = 1;
export const numberOfSpaces = 1;
export const numberOfFiles = 100;
export const numberOfDirs = 2;
export const numberOfChainDirs = 5;
export const numberOfTransfers = 300;

const tsWaiting = 0;
const tsOngoing = 1;
const tsEnded = 2;

const transferStates = ['waiting', 'ongoing', 'ended'];

export default Service.extend({
  store: service(),

  allTransfers: computed(() => transferStates.reduce((obj, state) => {
    obj[state] = [];
    return obj;
  }, {})),

  generateDevelopmentModel() {
    const store = this.get('store');
    return allFulfilled(
        types.map(type =>
          this.createEntityRecords(store, type, names)
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
                  return this.createFileRecords(store, rootDir, owner)
                    .then(() => this.createTransferRecords(store))
                    .then((transferList) => {
                      // currenlty to make it simpler, all files are rootDir
                      return allFulfilled(
                        transferList.map((transfer) => {
                          setProperties(transfer, {
                            dataSourceId: get(
                              rootDir,
                              'entityId'
                            ),
                            userId: get(owner, 'entityId'),
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

  createSpaceRecords(store) {
    const timestamp = Math.floor(Date.now() / 1000);
    return allFulfilled(_.range(numberOfSpaces).map((i) =>
      // root dirs
      store.createRecord('file', {
        id: generateFileGri(generateDirEntityId(0, '')),
        name: `Space ${i}`,
        type: 'dir',
        mtime: timestamp + i * 3600,
        parent: null,
      }).save()
    )).then(rootDirs => allFulfilled(_.range(numberOfSpaces).map((index) =>
      store.createRecord('space', {
        id: gri({
          entityType: 'op_space',
          entityId: generateSpaceEntityId(index),
          aspect: 'instance',
          scope: 'private',
        }),
        name: `Space ${index}`,
        rootDir: rootDirs[index],
      }).save()
    )));
  },

  createTransferRecords(store) {
    const timestamp = Math.floor(Date.now() / 1000);
    return allFulfilled([tsWaiting, tsOngoing, tsEnded].map(stateNum => {
      const transfersGroup = allFulfilled(_.range(numberOfTransfers).map(i => {
        const scheduleTime = stateNum >= tsWaiting ?
          timestamp + i * 3600 : null;
        const startTime = stateNum >= tsOngoing ?
          timestamp + (i + 1) * 3600 : null;
        const finishTime = stateNum >= tsEnded ?
          timestamp + (i + 2) * 3600 : null;
        const entityId = generateTransferEntityId(i, stateNum, scheduleTime,
          finishTime);
        return store.createRecord('transfer', {
          id: gri({
            entityType: 'op_transfer',
            entityId,
            aspect: 'instance',
            scope: 'private',
          }),
          dataSourceName: `/some/path/file-${i}`,
          dataSourceType: 'dir',
          // this will be set in main function to use generated records
          // dataSourceId,
          // userId,
          // replicatingProvider
          queryParams: 'hello=1,world=2',
          scheduleTime,
          startTime,
          finishTime,
        }).save();
      }));
      this.get('allTransfers')[transferStates[stateNum]] = transfersGroup;
      return transfersGroup;
    })).then(transfers => _.flatten(transfers));
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
      .then(allFulfilled(_.range(numberOfFiles).map((i) => {
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
      })));
  },

  createEntityRecords(store, type, names, additionalInfo) {
    switch (type) {
      case 'space':
        return this.createSpaceRecords(store, additionalInfo);
      case 'transfer':
        return this.createTransferRecords(store, additionalInfo);
      default:
        return allFulfilled(names.map(number =>
          store.createRecord(type, { name: `${type} ${number}` }).save()
        ));
    }
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
      stateName = 'started';
      break;
    case tsWaiting:
      stateName = 'scheduled';
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
    entityType: 'op_transfer',
    entityId: entityId,
    aspect: 'instance',
    scope: 'private',
  });
}
