import archiveFilesystem from './archive-filesystem';
import archive from './archive';
import dataset from './dataset';
import filesystem from './filesystem';
import sharedFilesystem from './shared-filesystem';
import transfer from './transfer';

export default {
  noViewTip: 'Column hidden due to limited horizontal space. Try resizing the browser window, decreasing zoom or disabling other columns.',
  moveUp: 'Change order<br/>(move backward)',
  moveDown: 'Change order<br/>(move forward)',
  archiveFilesystem,
  archive,
  dataset,
  filesystem,
  sharedFilesystem,
  transfer,
};
