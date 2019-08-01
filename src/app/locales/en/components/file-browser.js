export default {
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
  },
  fbTable: {
    menuSelection: 'Selection ({{selectionCount}})',
    header: {
      files: 'Files',
      size: 'Size',
      modification: 'Modification',
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
  fbBreadcrumbs: {
    menuCurrentDir: 'Current directory',
  },
  fbCreateItemModal: {
    create: 'Create',
    cancel: 'Cancel',
    createHeader: {
      dir: 'Create new directory:',
    },
    createIntro: {
      dir: 'Enter new directory name',
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
};
