import { camelize } from '@ember/string';
import { get, set } from '@ember/object';
import { all } from 'rsvp';
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

export const numberOfSpaces = 1;
// FIXME: debug values
export const numberOfFiles = 50;
export const numberOfDirs = 2;
export const numberOfChainDirs = 5;

export default function generateDevelopmentModel(store) {
  // let spaces;
  return all(
      types.map(type =>
        createEntityRecords(store, type, names)
        .then(records => {
          switch (type) {
            case 'space':
              // spaces = records;
              break;
          }
          return createListRecord(store, type, records);
        })
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
                return createFileRecords(store, rootDir, owner);
              });
            });
          })
          .then(() => listRecords);
      });
    })
    .then(listRecords => createUserRecord(store, listRecords))
    .then(user => {
      return user.get('spaceList')
        .then(spaceList => get(spaceList, 'list'))
        .then(list => all(list.toArray()))
        .then(spaces => all(spaces.map(space => {
          set(space, 'owner', user);
          return space.save();
        })))
        .then(() => user);
    });
}

function createListRecord(store, type, records) {
  const listType = type + 'List';
  const listRecord = store.createRecord(listType, {});
  return get(listRecord, 'list').then(list => {
    list.pushObjects(records);
    return list.save().then(() => listRecord.save());
  });
}

function createSpaceRecords(store) {
  const timestamp = Math.floor(Date.now() / 1000);
  return all(_.range(numberOfSpaces).map((i) =>
    // root dirs
    store.createRecord('file', {
      id: generateFileGri(generateDirEntityId(0, '')),
      name: `Space ${i}`,
      type: 'dir',
      mtime: timestamp + i * 3600,
      parent: null,
    }).save()
  )).then(rootDirs => all(_.range(numberOfSpaces).map((index) =>
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
}

function createFileRecords(store, parent, owner) {
  const timestamp = Math.floor(Date.now() / 1000);
  const parentEntityId = get(parent, 'entityId');
  return all(_.range(numberOfDirs).map((i) => {
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
        all(_.range(numberOfChainDirs).map((i) => {
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
          return all(saves);
        });
      }
    })
    .then(all(_.range(numberOfFiles).map((i) => {
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
}

function createEntityRecords(store, type, names, additionalInfo) {
  switch (type) {
    case 'space':
      return createSpaceRecords(store, additionalInfo);
    default:
      return all(names.map(number =>
        store.createRecord(type, { name: `${type} ${number}` }).save()
      ));
  }
}

function createUserRecord(store, listRecords) {
  const userRecord = store.createRecord('user', {
    id: store.userGri(userEntityId),
    fullName,
    username,
  });
  listRecords.forEach(lr =>
    userRecord.set(camelize(lr.constructor.modelName), lr)
  );
  return userRecord.save();
}

export function generateFileEntityId(i, parentEntityId) {
  return btoa(`${parentEntityId}-file-${String(i).padStart(4, '0')}`);
}

export function generateDirEntityId(i, parentEntityId, suffix = '') {
  return btoa(`${parentEntityId}-dir-${String(i).padStart(4, '0')}${suffix}`);
}

export function generateFileGri(entityId) {
  return gri({
    entityType: 'file',
    entityId: entityId,
    aspect: 'instance',
    scope: 'private',
  });
}
