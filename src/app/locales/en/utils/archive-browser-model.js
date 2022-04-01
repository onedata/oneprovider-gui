import BaseBrowserModel from './base-browser-model';
import _ from 'lodash';

export const createIncrementalArchive = 'Create incremental archive';

export default _.merge({}, BaseBrowserModel, {
  startingDownload: 'starting archive download',
  archiveList: 'Archives list',
  alreadyPurging: 'Not available for archives that are being purged.',
  notAvailableForCreating: 'Not available for archives that are not built yet.',
  notAvailableForDetached: 'Not available in detached dataset.',
  fileActions: {
    archiveSettings: 'Properties',
    editDescription: 'Edit description',
    createArchive: 'Create archive',
    createIncrementalArchive,
    recall: 'Recall to...',
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
