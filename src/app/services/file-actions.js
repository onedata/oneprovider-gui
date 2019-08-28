/**
 * Globally available implementation of actions invoked on file sets.
 * 
 * @module services/file-actions
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { setProperties } from '@ember/object';

function dummyAction(message, files) {
  alert(message + files.mapBy('name'));
}

export default Service.extend({
  store: service(),
  fileManager: service(),
  uploadManager: service(),

  // #region Actions implementation

  actUpload() {
    this.get('uploadManager').triggerUploadDialog();
  },

  actInfo(files) {
    dummyAction('info: ', files);
  },

  actShare(files) {
    dummyAction('share: ', files);
  },

  actMetadata(files) {
    dummyAction('metadata: ', files);
  },

  actPermissions(files) {
    dummyAction('permissions: ', files);
  },

  actDistribution(files) {
    dummyAction('distribution: ', files);
  },

  actCopy(files) {
    const fileManager = this.get('fileManager');
    setProperties(
      fileManager, {
        fileClipboardFiles: files,
        fileClipboardMode: 'copy',
      }
    );
  },

  actCut(files) {
    const fileManager = this.get('fileManager');
    setProperties(
      fileManager, {
        fileClipboardFiles: files,
        fileClipboardMode: 'move',
      }
    );
  },

  actDelete(files) {
    dummyAction('delete: ', files);
  },

  // #endregion
});
