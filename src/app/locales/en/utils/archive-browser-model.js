import BaseBrowserModel from './base-browser-model';
import _ from 'lodash';

export default _.merge({}, BaseBrowserModel, {
  startingDownload: 'starting archive download',
  archiveList: 'Archives list',
  alreadyPurging: 'Not available for archives that are being purged.',
  fileActions: {
    createArchive: 'Create archive',
    downloadTar: 'Download (tar)',
    purge: {
      multi: 'Purge archives',
      single: 'Purge archive',
    },
  },
});
