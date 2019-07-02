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

  // FIXME: old order, just to remember and remove in production
  // buttons: collect(
  //   'btnUpload',
  //   'btnNewDir',
  //   'separator',
  //   'btnInfo',
  //   'btnShare',
  //   'btnMetadata',
  //   'btnPermissions',
  //   'btnDistribution',
  //   'separator',
  //   'btnRename',
  //   'btnCopy',
  //   'btnCut',
  //   'btnDelete',
  // ),
});
