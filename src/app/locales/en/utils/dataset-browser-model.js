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
    changeState: {
      attach: 'Re-attach',
      detach: 'Detach',
    },
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
});
