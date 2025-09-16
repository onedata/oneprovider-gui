import { FileType } from 'onedata-gui-common/utils/file';

export default {
  headerText: 'Remove share',
  messageText: 'Are you sure you want to remove share <strong>{{shareName}}</strong>? The shared {{fileType}} will no longer be accessible via the associated share link.',
  messageTextOtherShares: 'However, the other shares ({{otherSharesCount}}) will still work.',
  deletingShare: 'deleting share',
  proceed: 'Remove',
  cancel: 'Cancel',
  fileType: {
    [FileType.Regular]: 'file',
    [FileType.Directory]: 'directory',
  },
};
