import _ from 'lodash';
import FbTableRow from '../file-browser/fb-table-row';

export default _.merge({}, FbTableRow, {
  fileType: {
    file: 'file',
    dir: 'directory',
  },
  rootFileDeletedTip: 'Root {{fileType}} has been deleted.',
});
