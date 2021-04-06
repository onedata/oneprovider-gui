export default {
  unknownError: 'Unknown error',
  startingDownload: 'starting file download',
  menuSelection: 'Selection ({{selectionCount}})',
  header: {
    files: 'Files',
    size: 'Size',
    modification: 'Modification',
  },
  emptyDirBox: {
    emptyDirectory: 'Empty directory',
    dragFilesHere: 'Drag files here to',
    upload: 'upload',
    createNewDirectory: 'create a new directory',
    youCanAlso: 'You can also',
    paste: 'paste',
    filesFromClipboard: 'files from clipboard',
    or: 'or',
    dataIsWriteProtected: 'Directory data is write protected',
    // NOTE: any changes should be synchronized with locales/en/components/file-datasets/summary-header.js
    dataIsWriteProtectedTip: 'Data write protection causes files and directories to be protected from modifying their content or being deleted. Modification attempts will be rejected with EPERM POSIX error.',
  },
  errorDirBox: {
    errorOccurred: 'Loading directory contents failed',
  },
};
