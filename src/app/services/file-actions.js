/**
 * Globally available implementation of actions invoked on file sets.
 * 
 * @module services/file-actions
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service from '@ember/service';

export default Service.extend({
  // #region Actions implementation

  actUpload( /* files */ ) {
    alert('upload');
  },

  actNewDirectory( /* files */ ) {
    alert('new directory');
  },

  actInfo(files) {
    alert('info: ' + files);
  },

  actShare(files) {
    alert('share: ' + files);
  },

  actMetadata(files) {
    alert('metadata: ' + files);
  },

  actPermissions(files) {
    alert('permissions: ' + files);
  },

  actDistribution(files) {
    alert('distribution: ' + files);
  },

  actRename(files) {
    alert('rename: ' + files);
  },

  actCopy(files) {
    alert('copy: ' + files);
  },

  actCut(files) {
    alert('cut: ' + files);
  },

  actDelete(files) {
    alert('delete: ' + files);
  },

  // #endregion
});
