import { FileType } from 'onedata-gui-common/utils/file';

export default {
  removeShare: 'Remove share',
  rename: 'Rename',
  copyShareUrl: 'Copy share URL',
  deletedFileIconTip: 'This share points to a deleted file.',
  deletedDirectoryIconTip: 'This share points to a deleted directory.',
  shareUrl: 'Share URL',
  noPublicAccess: 'No public access',
  publicData: 'Public Data',
  publicDataTip: 'This {{fileType}} is exposed as Public Data.',
  notAvailable: 'n/a',
  warning: {
    file: 'This file is not accessible via any share because it has no <em>read</em> POSIX permission for <em>other</em>.',
    dir: 'This directory is not accessible via any share because it does not have both <em>read</em> and <em>execute</em> POSIX permissions for <em>other</em>.',
  },
  fileType: {
    [FileType.Regular]: 'file',
    [FileType.Directory]: 'directory',
    item: 'item',
  },
};
