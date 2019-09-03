const renameModalHeader = 'Rename';
const newNameFileIntro = 'Enter new file name:';
const newNameDirIntro = 'Enter new directory name:';

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
  fbTable: {
    startingDownload: 'starting file download',
    menuSelection: 'Selection ({{selectionCount}})',
    header: {
      files: 'Files',
      size: 'Size',
      modification: 'Modification',
    },
    emptyDirBox: {
      emptyDirectory: 'Empty directory',
      prompt: '',
    },
  },
  fbTableRow: {
    file: 'file',
    dir: 'directory',
    isShared: 'This directory is shared',
    hasMetadata: 'This {{type}} has non-empty metadata',
  },
  fbToolbar: {
    moreTools: 'More tools',
  },
  fbSelectionToolkit: {
    itemsSelected: 'Selection',
  },
  fbCreateItemModal: {
    submit: 'Create',
    cancel: 'Cancel',
    header: {
      dir: 'Create new directory:',
      file: 'Create new file',
    },
    intro: {
      dir: newNameDirIntro,
      file: newNameFileIntro,
    },
  },
  fbRemoveModal: {
    delete: 'Delete',
    yes: 'Yes',
    no: 'No',
    questionPrefix: 'Are you sure you want to permanently delete',
    questionSuffix: {
      file: 'this file?',
      dir: 'this directory and its contents?',
      multi: 'these {{count}} items?',
      multiMany: '{{count}} selected items?',
    },
  },
  fbRenameModal: {
    submit: 'Rename',
    cancel: 'Cancel',
    header: {
      dir: renameModalHeader,
      file: renameModalHeader,
    },
    intro: {
      dir: newNameDirIntro,
      file: newNameFileIntro,
    },
  },
  fbInfoModal: {
    header: '{{type}} details',
    file: 'File',
    dir: 'Directory',
    name: '{{type}} name',
    path: '{{type}} path',
    spaceId: 'Space ID',
    cdmiObjectId: 'CDMI Object ID',
    modificationTime: 'Modified at',
    owner: 'Owner',
    close: 'Close',
  },
};
