import BaseBrowserModel from './base-browser-model';
import _ from 'lodash';

export default _.merge({}, BaseBrowserModel, {
  fileType: {
    file: 'file',
    dir: 'directory',
  },
  fileActions: {
    showFile: {
      file: 'Reveal root file',
      dir: 'Reveal root directory',
    },
    protection: 'Write protection',
    changeState: {
      attach: 'Re-attach',
      detach: 'Detach',
    },
    remove: 'Remove',
  },
  toggleDatasetAttachment: {
    header: {
      attach: 'Attach dataset',
      detach: 'Detach dataset',
    },
    description: {
      attach: 'You are about to re-attach <strong>{{name}}</strong> dataset, that was orinally attached to file under path: <em>{{path}}</em>.',
      detach: 'You are about to detach <strong>{{name}}</strong> dataset from its root {{fileType}}, currently attached to file under path: <em>{{path}}</em>.',
    },
    proceedQuestion: 'Do you want to proceed?',
    yes: 'Proceed',
    changingState: 'changing dataset(s) state',
  },
  remove: {
    header: 'Remove selected datasets',
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
