import archiveFilesystem from './columns-configuration-popover/archive-filesystem';
import archive from './columns-configuration-popover/archive';
import dataset from './columns-configuration-popover/dataset';
import filesystem from './columns-configuration-popover/filesystem';
import sharedFilesystem from './columns-configuration-popover/shared-filesystem';
import transfer from './columns-configuration-popover/transfer';

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
