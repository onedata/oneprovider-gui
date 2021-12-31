import BaseBrowserModel from './base-browser-model';
import _ from 'lodash';

export const createIncrementalArchive = 'Create incremental archive';

export default _.merge({}, BaseBrowserModel, {
  startingDownload: 'starting archive download',
  archiveList: 'Archives list',
  alreadyPurging: 'Not available for archives that are being purged.',
  notAvailableForDetached: 'Not available in detached dataset.',
  fileActions: {
    createArchive: 'Create archive',
    createIncrementalArchive,
    recall: 'Recall as...',
    downloadTar: 'Download (tar)',
    copyArchiveId: 'Copy archive ID',
    purge: {
      multi: 'Purge archives',
      single: 'Purge archive',
    },
    browseDip: 'Browse DIP',
  },
  archiveId: 'archive ID',
  selectedArchiveNoDip: 'Selected archive does not include DIP.',
});
