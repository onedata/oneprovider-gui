import { FileType } from 'onedata-gui-common/utils/file';

export default {
  headerText: 'Remove Share',
  messageText: 'Are you sure you want to remove Share <strong>{{shareName}}</strong>? The shared {{fileType}} will no longer be accessible via the associated public link.',
  messageTextOtherShares: 'However, the other Shares ({{otherSharesCount}}) will still work.',
  deletingShare: 'deleting Share',
  proceed: 'Remove',
  cancel: 'Cancel',
  fileType: {
    [FileType.Regular]: 'file',
    [FileType.Directory]: 'directory',
  },
};
