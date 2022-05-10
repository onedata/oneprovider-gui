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
    toggleDatasetAttachment: {
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
};
