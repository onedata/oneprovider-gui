import Component from '@ember/component';
import { resolve } from 'rsvp';

export const exampleCdmiObjectId =
  '0000000000466F8867756964233666396333666230366265366163353530343634616537383831306430656662233732333065663438326234333936376463373332313734373435306535363134';

export const fileParent1 = {
  name: 'Third one',
  parent: resolve(null),
  type: 'dir',
  hasParent: false,
  cdmiObjectId: exampleCdmiObjectId,
  modificationTime: Math.floor(Date.now() / 1000),
};

export const file1 = {
  name: 'OnedatadsjsdOnedatadsjsdOnedatadsjsdOnedatadsjsdOnedatadsjsdOnedatadsjsdOnedatadsjsdOnedatadsjsdOnedatadsjsdOnedatadsjsdOnedatadsjsdOnedatadsjsdOnedatadsjsdOnedatadsjsdOnedatadsjsdOnedatadsjsdOnedatadsjsdOnedatadsjsdOnedatadsjsdOnedatadsjsdOnedatadsjsd.txt',
  parent: resolve(fileParent1),
  size: 343284367423,
  type: 'file',
  hasParent: true,
  cdmiObjectId: exampleCdmiObjectId,
  modificationTime: Math.floor(Date.now() / 1000),
  owner: resolve({ fullName: 'John Smith' }),
};

export default Component.extend({
  opened: true,
  file: file1,

  actions: {
    closeModal() {
      this.set('file', null);
    },
    download() {
      return window.open(
        'https://oneprovider-1.local-onedata.org/download/test-file.bin',
        '_blank'
      );
    },
  },
});
