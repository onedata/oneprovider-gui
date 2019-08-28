/**
 * Globally available implementation of actions invoked on file sets.
 * 
 * @module services/file-actions
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { get } from '@ember/object';
import { setProperties } from '@ember/object';

function dummyAction(message, files) {
  alert(message + files.mapBy('name'));
}

export default Service.extend({
  store: service(),
  fileServer: service(),

  // #region Actions implementation

  actUpload([parentDir]) {
    alert('upload to ' + get(parentDir, 'name'));
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
    const fileServer = this.get('fileServer');
    setProperties(
      fileServer, {
        fileClipboardFiles: files.toArray(),
        fileClipboardMode: 'copy',
      }
    );
  },

  actCut(files) {
    const fileServer = this.get('fileServer');
    setProperties(
      fileServer, {
        fileClipboardFiles: files.toArray(),
        fileClipboardMode: 'move',
      }
    );
  },

  // #endregion
});
