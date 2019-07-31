import { camelize } from '@ember/string';
import { get } from '@ember/object';
import { Promise } from 'rsvp';
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
export const numberOfFiles = 1000;

export default function generateDevelopmentModel(store) {
  // let spaces;
  return Promise.all(
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
    .then(([spaceList]) => {
      return get(spaceList, 'list').then(list => {
        return list.forEach(space => {
          return get(space, 'rootDir').then(rootDir => {
            return createFileRecords(store, rootDir);
          });
        });
      });
    })
    .then(listRecords => createUserRecord(store, listRecords));
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
  return Promise.all(_.range(numberOfSpaces).map((i) =>
    // root dirs
    store.createRecord('file', {
      name: `Space ${i}`,
      type: 'dir',
      mtime: timestamp + i * 3600,
      parent: null,
    }).save()
  )).then(rootDirs => Promise.all(_.range(numberOfSpaces).map((index) =>
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

function createFileRecords(store, parent) {
  const timestamp = Math.floor(Date.now() / 1000);
  const parentEntityId = get(parent, 'entityId');
  return Promise.all(_.range(numberOfFiles).map((i) => {
    const entityId = generateFileEntityId(i, parentEntityId);
    const id = generateFileGri(entityId);
    return store.createRecord('file', {
      id,
      name: `File ${String(i).padStart(4, '0')}`,
      index: entityId,
      type: 'file',
      size: i * 1000000,
      mtime: timestamp + i * 3600,
      parent,
    }).save();
  }));
}

function createEntityRecords(store, type, names, additionalInfo) {
  switch (type) {
    case 'space':
      return createSpaceRecords(store, additionalInfo);
    default:
      return Promise.all(names.map(number =>
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
  return `${parentEntityId}-file-${String(i).padStart(4, '0')}`;
}

export function generateFileGri(entityId) {
  return gri({
    entityType: 'file',
    entityId: entityId,
    aspect: 'instance',
    scope: 'private',
  });
}
