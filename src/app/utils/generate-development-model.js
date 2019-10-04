// import { camelize } from '@ember/string';
// import { get, set, setProperties } from '@ember/object';
// import { all as allFulfilled } from 'rsvp';
// import gri from 'onedata-gui-websocket-client/utils/gri';
// import _ from 'lodash';
// import { generateSpaceEntityId } from 'onedata-gui-websocket-client/utils/development-model-common';

// const userEntityId = 'stub_user_id';
// const fullName = 'Stub user';
// const username = 'admin';

// const types = [
//   'space',
//   'transfer',
// ];

// export const names = ['One'];

// export const numberOfProviders = 1;
// export const numberOfSpaces = 1;
// // FIXME: debug values
// export const numberOfFiles = 300;
// export const numberOfDirs = 2;
// export const numberOfChainDirs = 5;
// export const numberOfTransfers = 300;

// const tsScheduled = 1;
// const tsStarted = 2;
// const tsFinished = 3;

// export default function generateDevelopmentModel(store) {
//   return allFulfilled(
//       types.map(type =>
//         createEntityRecords(store, type, names)
//         .then(records => {
//           return createListRecord(store, type, records);
//         })
//       )
//     )
//     .then((listRecords) => {
//       const [spaceList, transferList] = listRecords;
//       return store.createRecord('user', {
//         fullName: 'John Smith',
//         username: 'smith',
//       }).save().then(owner => {
//         return get(spaceList, 'list').then(list => {
//             return list.forEach(space => {
//               return get(space, 'rootDir').then(rootDir => {
//                 return createFileRecords(store, rootDir, owner)
//                   .then(() => {
//                     // currenlty to make it simpler, all files are rootDir
//                     transferList.map((transfer) => {
//                       setProperties(transfer, {
//                         dataSourceId: get(rootDir, 'entityId'),
//                         userId: get(owner, 'entityId'),
//                       });
//                       return transfer.save();
//                     });
//                   });
//               });
//             });
//           })
//           .then(() => listRecords);
//       });
//     })
//     .then(listRecords => createUserRecord(store, listRecords))
//     .then(user => {
//       return user.get('spaceList')
//         .then(spaceList => get(spaceList, 'list'))
//         .then(list => allFulfilled(list.toArray()))
//         .then(spaces => allFulfilled(spaces.map(space => {
//           set(space, 'owner', user);
//           return space.save();
//         })))
//         .then(() => user);
//     });
// }

// function createListRecord(store, type, records) {
//   const listType = type + 'List';
//   const listRecord = store.createRecord(listType, {});
//   return get(listRecord, 'list').then(list => {
//     list.pushObjects(records);
//     return list.save().then(() => listRecord.save());
//   });
// }

// function createSpaceRecords(store) {
//   const timestamp = Math.floor(Date.now() / 1000);
//   return allFulfilled(_.range(numberOfSpaces).map((i) =>
//     // root dirs
//     store.createRecord('file', {
//       id: generateFileGri(generateDirEntityId(0, '')),
//       name: `Space ${i}`,
//       type: 'dir',
//       mtime: timestamp + i * 3600,
//       parent: null,
//     }).save()
//   )).then(rootDirs => allFulfilled(_.range(numberOfSpaces).map((index) =>
//     store.createRecord('space', {
//       id: gri({
//         entityType: 'op_space',
//         entityId: generateSpaceEntityId(index),
//         aspect: 'instance',
//         scope: 'private',
//       }),
//       name: `Space ${index}`,
//       rootDir: rootDirs[index],
//     }).save()
//   )));
// }

// function createTransferRecords(store) {
//   const timestamp = Math.floor(Date.now() / 1000);
//   return allFulfilled([tsScheduled, tsStarted, tsFinished].map((state) =>
//     allFulfilled(_.range(numberOfTransfers).map((i) => {
//       const scheduleTime = state >= tsScheduled ?
//         timestamp + i * 3600 : null;
//       const startTime = state >= tsStarted ?
//         timestamp + (i + 1) * 3600 : null;
//       const finishTime = state >= tsFinished ?
//         timestamp + (i + 2) * 3600 : null;
//       const entityId = generateTransferEntityId(i, state, scheduleTime, finishTime);
//       return store.createRecord('transfer', {
//         id: gri({
//           entityType: 'op_transfer',
//           entityId,
//           aspect: 'instance',
//           scope: 'private',
//         }),
//         dataSourceName: `/some/path/file-${i}`,
//         dataSourceType: 'dir',
//         // this will be set in main function to use generated records
//         // dataSourceId,
//         // userId,
//         // replicatingProvider
//         queryParams: 'hello=1,world=2',
//         scheduleTime,
//         startTime,
//         finishTime,
//       });
//     }))
//   ));
// }

// function createFileRecords(store, parent, owner) {
//   const timestamp = Math.floor(Date.now() / 1000);
//   const parentEntityId = get(parent, 'entityId');
//   return allFulfilled(_.range(numberOfDirs).map((i) => {
//       const entityId = generateDirEntityId(i, parentEntityId);
//       const id = generateFileGri(entityId);
//       return store.createRecord('file', {
//         id,
//         name: `Directory long long long long long long long long long long long long long long long long name ${String(i).padStart(4, '0')}`,
//         index: atob(entityId),
//         type: 'dir',
//         mtime: timestamp + i * 3600,
//         parent,
//         owner,
//       }).save();
//     }))
//     .then(([firstDir]) => {
//       if (numberOfDirs > 0) {
//         allFulfilled(_.range(numberOfChainDirs).map((i) => {
//           const entityId = generateDirEntityId(
//             0,
//             parentEntityId,
//             `-c${String(i).padStart(4, '0')}`
//           );
//           const id = generateFileGri(entityId);
//           return store.createRecord('file', {
//             id,
//             name: `Chain directory long long long long long name ${String(i).padStart(4, '0')}`,
//             index: atob(entityId),
//             type: 'dir',
//             mtime: timestamp + i * 3600,
//             owner,
//           }).save();
//         })).then(chainDirs => {
//           let saves = [];
//           set(chainDirs[0], 'parent', firstDir);
//           saves.push(chainDirs[0].save());
//           for (let i = 1; i < chainDirs.length; ++i) {
//             set(chainDirs[i], 'parent', chainDirs[i - 1]);
//             saves.push(chainDirs[i].save());
//           }
//           return allFulfilled(saves);
//         });
//       }
//     })
//     .then(allFulfilled(_.range(numberOfFiles).map((i) => {
//       const entityId = generateFileEntityId(i, parentEntityId);
//       const id = generateFileGri(entityId);
//       return store.createRecord('file', {
//         id,
//         name: `file-${String(i).padStart(4, '0')}`,
//         index: atob(entityId),
//         type: 'file',
//         size: i * 1000000,
//         mtime: timestamp + i * 3600,
//         parent,
//         owner,
//       }).save();
//     })));
// }

// function createEntityRecords(store, type, names, additionalInfo) {
//   switch (type) {
//     case 'space':
//       return createSpaceRecords(store, additionalInfo);
//     case 'transfer':
//       return createTransferRecords(store, additionalInfo);
//     default:
//       return allFulfilled(names.map(number =>
//         store.createRecord(type, { name: `${type} ${number}` }).save()
//       ));
//   }
// }

// function createUserRecord(store, listRecords) {
//   const userRecord = store.createRecord('user', {
//     id: store.userGri(userEntityId),
//     fullName,
//     username,
//   });
//   listRecords.forEach(lr =>
//     userRecord.set(camelize(lr.constructor.modelName), lr)
//   );
//   return userRecord.save();
// }

// export function generateFileEntityId(i, parentEntityId) {
//   return btoa(`${parentEntityId}-file-${String(i).padStart(4, '0')}`);
// }

// export function generateDirEntityId(i, parentEntityId, suffix = '') {
//   return btoa(`${parentEntityId}-dir-${String(i).padStart(4, '0')}${suffix}`);
// }

// export function generateTransferEntityId(i, state, scheduleTime, startTime) {
//   let stateName;
//   switch (state) {
//     case tsStarted:
//       stateName = 'started';
//       break;
//     case tsScheduled:
//       stateName = 'scheduled';
//       break;
//     case tsFinished:
//       stateName = 'finished';
//       break;
//     default:
//       break;
//   }
//   return btoa(`transfer-${stateName}-${i}-${scheduleTime}-${startTime}`);
// }

// export function decodeTransferEntityId(entityId) {
//   const segments = atob(entityId).split('-');
//   return {
//     i: segments[1],
//     state: segments[2],
//     startTime: segments[3],
//     finishTime: segments[4],
//   };
// }

// export function generateFileGri(entityId) {
//   return gri({
//     entityType: 'file',
//     entityId: entityId,
//     aspect: 'instance',
//     scope: 'private',
//   });
// }

// export function generateTransferGri(entityId) {
//   return gri({
//     entityType: 'op_transfer',
//     entityId: entityId,
//     aspect: 'instance',
//     scope: 'private',
//   });
// }

export default function () {
  throw 'errrrrror';
}
