import BaseBrowserModel from './base-browser-model';
import _ from 'lodash';

export default _.merge({}, BaseBrowserModel, {
  startingDownload: 'starting file download',
  fileActions: {
    bagitUpload: 'Upload BagIt',
    upload: 'Upload files',
    newDirectory: 'New directory',
    refresh: 'Refresh',
    info: 'Information',
    download: 'Download',
    downloadTar: 'Download (tar)',
    share: 'Share',
    metadata: 'Metadata',
    datasets: 'Datasets',
    permissions: 'Permissions',
    qos: 'Quality of Service',
    distribution: 'Data distribution',
    runWorkflow: 'Run workflow',
    rename: 'Rename',
    createSymlinkSingular: 'Create symbolic link',
    createSymlinkPlural: 'Create symbolic links',
    createHardlinkSingular: 'Create hard link',
    createHardlinkPlural: 'Create hard links',
    placeSymlink: 'Place symbolic link',
    placeHardlink: 'Place hard link',
    copy: 'Copy',
    cut: 'Cut',
    delete: 'Delete',
    paste: 'Paste',
  },
  disabledActionReason: {
    protectionType: {
      data: 'data',
      metadata: 'metadata',
    },
    writeProtected: 'Not available for files with {{protectionType}} write protection.',
    blockedFileType: 'Not available for {{fileType}}.',
    fileTypesPlural: {
      file: 'files',
      dir: 'directories',
      symlink: 'symbolic links',
    },
    and: 'and',
    cannotRunWorkflowOpenfaasNotAvailable: 'This Oneprovider lacks OpenFaaS integration, required to run workflows.',
  },
  pasteFailed: {
    move: 'moving some of files',
    copy: 'copying some of files',
  },
  linkFailed: 'linking some of files',
});
