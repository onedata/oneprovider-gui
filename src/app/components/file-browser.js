import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import File from 'oneprovider-gui/models/file';
import _ from 'lodash';

export default Component.extend({
  classNames: ['file-browser'],

  uploadingManager: service(),

  dir: computed(function dir() {
    return File.create({
      id: this.get('dirId'),
      name: 'My directory',
      size: 350000000,
      modificationTime: Date.now(),
      provider: null,
      totalChildrenCount: 0,
      canViewDir: true,
      permissions: 0o644,
      parent: null,
      children: [{
          name: 'Other file with very long name',
          size: 29311232312312,
          type: 'file',
        },
        {
          name: 'Some directory',
          size: 29311232312312,
          type: 'dir',
        },
        {
          name: 'Other directory',
          size: 29311232312312,
          type: 'dir',
        },
        ..._.range(1, 10).map(i => ({
          name: `File ${i}`,
          size: 3000000 * i,
          type: 'file',
        })),
      ],
    });
  }),

  didInsertElement() {
    this._super(...arguments);

    const {
      element,
      uploadingManager,
    } = this.getProperties('element', 'uploadingManager');

    const uploadingDropElement = element.querySelector('.fb-table-container');
    uploadingManager.assignUploadingDrop(uploadingDropElement);

    const uploadingBrowseElement = element.querySelector('.browser-upload');
    uploadingManager.assignUploadingBrowse(uploadingBrowseElement);
  },
});
