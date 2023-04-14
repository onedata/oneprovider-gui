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
    recallInfo: 'Recall information',
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
    // NOTE: using non breaking hyphens in write-protected texts below
    writeProtected: 'Not available for {{protectionType}} write&#8209;protected files.',
    writeProtectedDir: 'Not available inside {{protectionType}} write&#8209;protected directories.',
    blockedFileType: 'Not available for {{fileType}}.',
    recalling: 'Not available for files being recalled from an archive.',
    inRecallingDir: 'Not available inside directory being recalled from an archive.',
    fileTypesPlural: {
      file: 'files',
      dir: 'directories',
      symlink: 'symbolic links',
    },
    and: 'and',
    cannotRunWorkflowOpenfaasNotAvailable: 'This Oneprovider lacks OpenFaaS integration, required to run workflows.',
  },
  hardlinkCreatesNewSymlinkTip: {
    single: 'This will create a copy of the symbolic link (e.g. a new symbolic link that references the same path).',
    plural: 'This will create a copy of the symbolic link (e.g. a new symbolic link that references the same path), for each selected symbolic link.',
  },
  pasteFailed: {
    move: 'moving some of files',
    copy: 'copying some of files',
  },
  linkFailed: 'linking some of files',
});
