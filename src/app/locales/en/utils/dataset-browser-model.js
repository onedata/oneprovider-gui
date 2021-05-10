import BaseBrowserModel from './base-browser-model';
import _ from 'lodash';

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
    remove: 'Remove dataset',
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
    introSingle: {
      attach: 'You are about to reattach <strong>{{name}}</strong> dataset, that was previously attached to the {{fileType}} at <code>{{path}}</code>.',
      detach: 'You are about to detach <strong>{{name}}</strong> dataset from its root {{fileType}} (<code>{{path}}</code>).',
    },
    introMulti: {
      attach: 'You are about to reattach <strong>{{count}}</strong> selected datasets.',
      detach: 'You are about to detach <strong>{{count}}</strong> selected datasets from their root directories or files.',
    },
    proceedQuestion: 'Do you want to proceed?',
    yes: 'Proceed',
    changingState: 'changing dataset(s) state',
  },
  remove: {
    header: {
      single: 'Remove selected dataset',
      multi: 'Remove selected datases',
    },
    selectedText: {
      single: '<strong>{{name}}</strong> dataset',
      multi: '<strong>{{count}}</strong> selected datasets',
    },
    description: 'You are about to remove {{selectedText}}. This procedure does not modify any files or directories that were a part of the dataset.',
    proceedQuestion: 'Do you want to proceed?',
    yes: 'Remove',
    removing: 'removing dataset(s)',
  },
  protection: {
    loadingRootFile: 'loading dataset root file',
  },
});
