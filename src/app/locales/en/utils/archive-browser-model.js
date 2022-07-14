import BaseBrowserModel from './base-browser-model';
import _ from 'lodash';

export const createIncrementalArchive = 'Create incremental archive';

export default _.merge({}, BaseBrowserModel, {
  startingDownload: 'starting archive download',
  archiveList: 'Archives list',
  alreadyDeleting: 'Not available for archives that are being deleted.',
  alreadyCancelling: 'Not available for archives that are being cancelled.',
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
    cancel: 'Cancel archivization',
    browseDip: 'Browse DIP',
  },
  archiveId: 'archive ID',
  selectedArchiveNoDip: 'Selected archive does not include DIP.',
  cancelModal: {
    header: 'Cancel archivization',
    message: {
      single: cancelModalMessage(false),
      multi: cancelModalMessage(true),
    },
    yes: 'Yes',
    no: 'No',
    cancelling: 'cancelling archivization',
  },
});

function cancelModalMessage(isMultiple) {
  const selectedArchivesText = isMultiple ? ' of {{archivesCount}} selected archives' : '';
  const pluralSuffix = isMultiple ? 's' : '';
  return `Are you sure you want to cancel the archivization process${selectedArchivesText}? The resulting archive${pluralSuffix} will be incomplete. Once cancelled, the process cannot be resumed.`;
}
