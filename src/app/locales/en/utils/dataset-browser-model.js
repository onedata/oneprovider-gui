import BaseBrowserModel from './base-browser-model';
import _ from 'lodash';

const proceedQuestion = 'Do you want to proceed?';

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

export default _.merge({}, BaseBrowserModel, {
  currentDataset: 'Current dataset',
  fileType: {
    file: 'file',
    dir: 'directory',
  },
  fileActions: {
    showFile: 'Show in file browser',
    protection: 'Write protection',
    changeState: {
      attach: 'Reattach',
      detach: 'Detach',
    },
    remove: {
      single: 'Remove dataset',
      multi: 'Remove datasets',
    },
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
    proceedQuestion,
    yes: 'Proceed',
    changingState: 'changing some dataset(s) state',
  },
  remove: {
    header: {
      single: removeHeader(false),
      multi: removeHeader(true),
    },
    description: {
      single: removeDescription(false),
      multi: removeDescription(true),
    },
    proceedQuestion,
    yes: 'Remove',
    removing: 'removing some dataset(s)',
  },
  protection: {
    loadingRootFile: 'loading dataset root file',
  },
});
