import archiveFilesystem from '../-browser-columns-name/archive-filesystem';
import archive from '../-browser-columns-name/archive';
import dataset from '../-browser-columns-name/dataset';
import filesystem from '../-browser-columns-name/filesystem';
import shareFilesystem from '../-browser-columns-name/share-filesystem';
import transfer from '../-browser-columns-name/transfer';

export default {
  noViewTip: 'Column hidden due to limited horizontal space. Try resizing the browser window, decreasing zoom or disabling other columns.',
  moveUp: 'Change order<br/>(move backward)',
  moveDown: 'Change order<br/>(move forward)',
  removeTip: 'Remove this column',
  modifyTip: 'Modify this column',
  archiveFilesystem: archiveFilesystem.headers,
  archive,
  dataset,
  filesystem,
  shareFilesystem: shareFilesystem.headers,
  transfer,
};
