import Component from '@ember/component';
import { resolve } from 'rsvp';

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
  modificationTime: Date.now() / 1000,
};

export const file1 = {
  name: 'Onedata.txt',
  size: 1.5 * Math.pow(1024, 2),
  parent: resolve(fileParent1),
  type: 'file',
  hasParent: true,
  cdmiObjectId: exampleCdmiObjectId,
  modificationTime: Date.now() / 1000,
  owner: resolve(owner1),
};

export default Component.extend({
  opened: true,
  fileToShowInfo: file1,
  spaceEntityId: 'r847534678456r7betf67w5r6ew8vfrt6785r',

  actions: {
    closeInfoModal() {
      this.set('fileToShowInfo', null);
    },
  },
});
