import fbTable from './file-browser/fb-table';
import fbTableRow from './file-browser/fb-table-row';
import fbToolbar from './file-browser/fb-toolbar';
import fbSelectionToolkit from './file-browser/fb-selection-toolkit';
import fbCreateItemModal from './file-browser/fb-create-item-modal';
import fbRemoveModal from './file-browser/fb-remove-modal';
import fbRenameModal from './file-browser/fb-rename-modal';
import fbInfoModal from './file-browser/fb-info-modal';
import fbDownloadModal from './file-browser/fb-download-modal';
import fbShareModal from './file-browser/fb-share-modal';
import fbShareModalItem from './file-browser/fb-share-modal-item';

export default {
  menuCurrentDir: 'Current directory',
  pasteFailed: {
    move: 'moving some of files',
    copy: 'copying some of files',
  },
  pasteFailedDetails: {
    single: '{{reason}}',
    multi: '{{reason}} and {{moreCount}} more errors',
  },
  fileActions: {
    upload: 'Upload files',
    newDirectory: 'New directory',
    info: 'Information',
    share: 'Share',
    metadata: 'Metadata',
    permissions: 'Permissions',
    distribution: 'Data distribution',
    rename: 'Rename',
    copy: 'Copy',
    cut: 'Cut',
    delete: 'Delete',
    paste: 'Paste',
  },
  fbTable,
  fbTableRow,
  fbToolbar,
  fbSelectionToolkit,
  fbCreateItemModal,
  fbRemoveModal,
  fbRenameModal,
  fbInfoModal,
  fbDownloadModal,
  fbShareModal,
  fbShareModalItem,
};
