import BaseBrowserModel from './base-browser-model';
import _ from 'lodash';

export default _.merge({}, BaseBrowserModel, {
  fileActions: {
    showFile: {
      file: 'Reveal root file',
      dir: 'Reveal root directory',
    },
  },
});
