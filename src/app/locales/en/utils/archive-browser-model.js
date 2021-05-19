import BaseBrowserModel from './base-browser-model';
import _ from 'lodash';

export default _.merge({}, BaseBrowserModel, {
  archiveList: 'Archives list',
  fileActions: {
    downloadTar: 'Download (tar)',
  },
});
