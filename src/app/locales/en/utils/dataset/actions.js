const partials = {
  selectedSingle: '<strong>{{name}}</strong> dataset',
  selectedMulti: '<strong>{{count}}</strong> selected datasets',
};

function removeDescription(isMulti) {
  const selected = partials[isMulti ? 'selectedMulti' : 'selectedSingle'];
  return `You are about to remove ${selected}. This procedure does not modify any files or directories that were a part of the dataset${isMulti ? 's' : ''}.`;
}

function removeHeader(isMulti) {
  return `Remove selected dataset${isMulti ? 's' : ''}`;
}

const fileType = {
  file: 'file',
  dir: 'directory',
  symlink: 'symlink',
};

export default {
  copyDatasetId: {
    title: 'Copy ID',
  },
  createArchive: {
    title: 'Create archive',
    tip: {
      notAvailableForDetached: 'Not available for detached datasets.',
    },
  },
  changeState: {
    fileType,
    title: {
      attach: 'Reattach',
      detach: 'Detach',
    },
    tip: {
      cannotReattachDeleted: 'Not available for datasets with root file deleted.',
    },
    confirmModal: {
      header: {
        single: {
          attach: 'Reattach dataset',
          detach: 'Detach dataset',
        },
        multi: {
          attach: 'Reattach datasets',
          detach: 'Detach datasets',
        },
      },
      intro: {
        attach: {
          single: 'You are about to reattach <strong>{{name}}</strong> dataset to its original root {{fileType}} at <code class="inline-file-path">{{path}}</code>.',
          multi: 'You are about to reattach <strong>{{count}}</strong> selected datasets to their original root directories/files',
        },
        detach: {
          single: 'You are about to detach <strong>{{name}}</strong> dataset from its root {{fileType}} (<code class="inline-file-path">{{path}}</code>).',
          multi: 'You are about to detach <strong>{{count}}</strong> selected datasets from their root directories/files.',
        },
      },
      proceedQuestion: 'Do you want to proceed?',
      yes: 'Proceed',
      changingState: 'changing some dataset(s) state',
    },
  },
  remove: {
    title: 'Remove',
    tip: {
      notAvailableHaveArchives: 'Not availabe for datasets with created archives.',
    },
    confirmModal: {
      header: {
        single: removeHeader(false),
        multi: removeHeader(true),
      },
      description: {
        single: removeDescription(false),
        multi: removeDescription(true),
      },
      proceedQuestion: 'Do you want to proceed?',
      yes: 'Remove',
      removing: 'removing some dataset(s)',
    },
  },
};
