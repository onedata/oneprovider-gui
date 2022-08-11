import Component from '@ember/component';
import { resolve } from 'rsvp';
import { inject as service } from '@ember/service';

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
  modificationTime: Math.floor(Date.now() / 1000),
  owner: resolve(owner1),
};

export const file1 = {
  name: 'Onedata.txt',
  size: 1.5 * Math.pow(1024, 2),
  parent: resolve(fileParent1),
  type: 'file',
  hasParent: true,
  cdmiObjectId: exampleCdmiObjectId,
  modificationTime: Math.floor(Date.now() / 1000),
  owner: resolve(owner1),
};

export const parentShare = {
  id: 'op_share.share_id.instance:private',
  entityId: 'share_id',
  name: 'My share',
  hasHandle: true,
};

export default Component.extend({
  mockBackend: service(),

  opened: true,

  // uncomment for locally-mocked file
  space: space1,
  share: parentShare,
  fileToShowInfo: fileParent1,

  // uncomment for globally-mocked file
  // space: reads('mockBackend.entityRecords.space.0'),
  // share: null,
  // fileToShowInfo: reads('mockBackend.entityRecords.file.5'),

  actions: {
    closeInfoModal() {
      this.set('fileToShowInfo', null);
    },
    getDataUrl() {
      return window.location.toString();
    },
  },
});
