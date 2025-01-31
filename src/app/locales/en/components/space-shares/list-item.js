import { FileType } from 'onedata-gui-common/utils/file';

export default {
  removeShare: 'Remove Share',
  rename: 'Rename',
  copyShareUrl: 'Copy Share URL',
  deletedFileIconTip: 'This Share points to a deleted file.',
  deletedDirectoryIconTip: 'This Share points to a deleted directory.',
  shareUrl: 'Share URL',
  noPublicAccess: 'No public access',
  publicData: 'Public Data',
  publicDataTip: 'This {{fileType}} is exposed as Public Data.',
  notAvailable: 'n/a',
  warning: {
    file: 'This file is not accessible via any Share because it has no <em>read</em> POSIX permission for <em>other</em>.',
    dir: 'This directory is not accessible via any Share because it does not have both <em>read</em> and <em>execute</em> POSIX permissions for <em>other</em>.',
  },
  fileType: {
    [FileType.Regular]: 'file',
    [FileType.Directory]: 'directory',
    item: 'item',
  },
};
