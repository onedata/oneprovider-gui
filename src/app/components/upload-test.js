import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
  uploadingManager: service(),

  didInsertElement() {
    this._super(...arguments);

    const {
      element,
      uploadingManager,
    } = this.getProperties('element', 'uploadingManager');

    uploadingManager.assignUploadingDrop(element.querySelector('.upload-zone'));
    uploadingManager.assignUploadingBrowse(element.querySelector('#file-browse'));
  },
  
});
