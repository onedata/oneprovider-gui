import BaseBrowserModel from './base-browser-model';
import _ from 'lodash';

export default _.merge({}, BaseBrowserModel, {
  startingDownload: 'starting archive download',
  archiveList: 'Archives list',
  fileActions: {
    createArchive: 'Create archive',
    downloadTar: 'Download (tar)',
  },
});
