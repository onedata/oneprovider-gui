import { FileType } from 'onedata-gui-common/utils/file';

export default {
  removeShare: 'Remove share',
  rename: 'Rename',
  copyPublicUrl: 'Copy public URL',
  deletedFileIconTip: 'This share points to a deleted file.',
  deletedDirectoryIconTip: 'This share points to a deleted directory.',
  publicUrl: 'share public URL',
  noPublicAccess: 'No public access',
  openData: 'Open Data',
  openDataTip: 'This {{fileType}} is published as Open Data.',
  couldNotGetPath: 'Could not resolve share root file path',
  warning: {
    file: 'This file is not accessible via any public share because it has no <em>read</em> POSIX permission for <em>other</em>.',
    dir: 'This directory is not accessible via any public share because it does not have both <em>read</em> and <em>execute</em> POSIX permissions for <em>other</em>.',
  },
  fileType: {
    [FileType.Regular]: 'file',
    [FileType.Directory]: 'directory',
    [FileType.SymbolicLink]: 'symbolic link',
    item: 'item',
  },
};
