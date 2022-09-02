import Component from '@ember/component';
import { resolve } from 'rsvp';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { collect } from 'ember-awesome-macros';

export const exampleCdmiObjectId =
  '0000000000466F8867756964233666396333666230366265366163353530343634616537383831306430656662233732333065663438326234333936376463373332313734373435306535363134';

export const owner1 = {
  fullName: 'John Smith',
};

export const space1 = {
  entityId: 'hello',
};

export const fileParentRoot = {
  name: 'My space',
  parent: resolve(null),
  type: 'dir',
  hasParent: false,
};

// FIXME: move to mock backend
export const storageLocations = {
  locationsPerProvider: {
    provider: {
      locationsPerStorage: {
        storage: 'path',
      },
    },
  },
};

export const fileParent3 = {
  name: 'First',
  parent: resolve(fileParentRoot),
  type: 'dir',
  hasParent: true,
};

export const fileParent2 = {
  name: 'Second directory',
  parent: resolve(fileParent3),
  type: 'dir',
  hasParent: true,
};

export const fileParent1 = {
  name: 'Third one',
  parent: resolve(fileParent2),
  type: 'dir',
  hasParent: true,
  cdmiObjectId: exampleCdmiObjectId,
  modificationTime: Math.floor(Date.now() / 1000),
  owner: resolve(owner1),
};

// FIXME: check usages and remove from here
export const file1 = {
  name: 'Onedata.txt',
  size: 1.5 * Math.pow(1024, 2),
  parent: resolve(fileParent1),
  type: 'file',
  hasParent: true,
  cdmiObjectId: exampleCdmiObjectId,
  modificationTime: Math.floor(Date.now() / 1000),
  owner: resolve(owner1),
  posixPermissions: '644',
  activePermissionsType: 'posix',
  storageLocations,
};

export default Component.extend({
  mockBackend: service(),

  opened: true,

  // uncomment for globally-mocked file
  space: reads('mockBackend.entityRecords.space.0'),
  share: null,
  files: collect('mockBackend.entityRecords.file.5'),

  // uncomment for multi files
  // files: collect(
  //   // a file with QoS
  //   'mockBackend.entityRecords.chainDir.2',
  //   'mockBackend.entityRecords.chainDir.3',
  //   'mockBackend.entityRecords.chainDir.4',
  // ),

  previewMode: false,

  actions: {
    closeInfoModal() {
      this.set('files', null);
    },
    getDataUrl() {
      return window.location.toString();
    },
  },
});
