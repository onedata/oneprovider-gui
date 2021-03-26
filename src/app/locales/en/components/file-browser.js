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
import fbMetadataModal from './file-browser/fb-metadata-modal';
import fbMetadataXattrs from './file-browser/fb-metadata-xattrs';
import fbMetadataJson from './file-browser/fb-metadata-json';
import fbMetadataRdf from './file-browser/fb-metadata-rdf';

export default {
  menuCurrentDir: 'Current directory',
  refreshingDirectory: 'refreshing directory',
  pasteFailed: {
    move: 'moving some of files',
    copy: 'copying some of files',
  },
  linkFailed: 'linking some of files',
  pasteFailedDetails: {
    single: '{{reason}}',
    multi: '{{reason}} and {{moreCount}} more errors',
  },
  cannotHardlinkDirectory: 'Hard links to directories are disallowed.',
  fileActions: {
    upload: 'Upload files',
    newDirectory: 'New directory',
    refresh: 'Refresh',
    info: 'Information',
    share: 'Share',
    metadata: 'Metadata',
    permissions: 'Permissions',
    qos: 'Quality of Service',
    distribution: 'Data distribution',
    rename: 'Rename',
    createLinkSingular: 'Create link',
    createLinkPlural: 'Create links',
    placeSymlink: 'Place symbolic link',
    placeHardlink: 'Place hard link',
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
  fbMetadataModal,
  fbMetadataXattrs,
  fbMetadataJson,
  fbMetadataRdf,
};
