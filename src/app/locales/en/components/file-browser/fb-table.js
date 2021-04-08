import { dataWriteProtectionEnabled } from '../file-datasets/summary-header';

export default {
  unknownError: 'Unknown error',
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
    dataIsWriteProtectedTip: dataWriteProtectionEnabled,
  },
  errorDirBox: {
    errorOccurred: 'Loading directory contents failed',
  },
};
