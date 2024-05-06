import Component from '@ember/component';
import { exampleDublinCore } from 'oneprovider-gui/utils/mock-data';
import { resolve } from 'rsvp';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';

export default Component.extend({
  xmlSource: exampleDublinCore,

  init() {
    this._super(...arguments);
    const handleService = {
      entityId: '32132131234123',
      name: 'AGH University',
    };
    const handle = {
      entityId: '35234129487389',
      url: 'https://doi.org/1321241240132/2312312',
      metadataString: exampleDublinCore,
      handleService: promiseObject(resolve(handleService)),
    };
    const share = {
      name: 'Hello world.txt',
      publicUrl: 'https://app.onedata.org/shares/232940123',
      fileType: 'file',
      description: '# Hello world\nSome example',
      hasHandle: true,
      handle: promiseObject(resolve(handle)),
    };
    this.set('share', share);
  },
});
