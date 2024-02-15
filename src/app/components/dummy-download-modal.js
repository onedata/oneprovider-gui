import Component from '@ember/component';
import { resolve } from 'rsvp';
import globals from 'onedata-gui-common/utils/globals';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { promise } from 'ember-awesome-macros';

export const exampleCdmiObjectId =
  '0000000000466F8867756964233666396333666230366265366163353530343634616537383831306430656662233732333065663438326234333936376463373332313734373435306535363134';

export const fileParent1 = {
  name: 'Third one',
  parent: resolve(null),
  type: 'dir',
  hasParent: false,
  cdmiObjectId: exampleCdmiObjectId,
  mtime: Math.floor(Date.now() / 1000),
};

export default Component.extend({
  store: service(),

  opened: true,
  fileProxy: promise.object(computed(async function fileProxy() {
    const owner = await this.store.createRecord('user', {
      fullName: 'John Smith',
    });
    const fileParent = await this.store.createRecord('file', {
      name: 'Third one',
      type: 'dir',
      cdmiObjectId: exampleCdmiObjectId,
      mtime: Math.floor(Date.now() / 1000),
    }).save();
    const file = await this.store.createRecord('file', {
      name: 'Mollit non ipsum cupidatat sint enim culpa sint nulla ipsum quis veniam minim eu qui.txt',
      parent: fileParent,
      size: 343284367423,
      type: 'file',
      cdmiObjectId: exampleCdmiObjectId,
      mtime: Math.floor(Date.now() / 1000),
      owner,
    }).save();
    return file;
  })),
  file: reads('fileProxy.content'),

  actions: {
    closeModal() {
      this.set('opened', false);
    },
    download() {
      return globals.window.open(
        'https://oneprovider-1.local-onedata.org/download/test-file.bin',
        '_blank'
      );
    },
  },
});
