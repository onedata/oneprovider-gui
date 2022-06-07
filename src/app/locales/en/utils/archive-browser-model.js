import BaseBrowserModel from './base-browser-model';
import _ from 'lodash';

export const createIncrementalArchive = 'Create incremental archive';

export default _.merge({}, BaseBrowserModel, {
  startingDownload: 'starting archive download',
  archiveList: 'Archives list',
  alreadyDeleting: 'Not available for archives that are being deleted.',
  notAvailableForCreating: 'Not available for archives that are not built yet.',
  notAvailableForDetached: 'Not available in detached dataset.',
  fileActions: {
    archiveProperties: 'Properties',
    editDescription: 'Edit description',
    createArchive: 'Create archive',
    createIncrementalArchive,
    recall: 'Recall to...',
    downloadTar: 'Download (tar)',
    copyArchiveId: 'Copy archive ID',
    delete: {
      multi: 'Delete archives',
      single: 'Delete archive',
    },
    browseDip: 'Browse DIP',
  },
  archiveId: 'archive ID',
  selectedArchiveNoDip: 'Selected archive does not include DIP.',
});
