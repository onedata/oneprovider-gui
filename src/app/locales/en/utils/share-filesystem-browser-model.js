import FilesystemBrowserModel from './filesystem-browser-model';
import _ from 'lodash';

export default _.merge({}, FilesystemBrowserModel, {
  fileActions: {
    copyPublicDownloadUrl: 'Copy download URL',
  },
  btnCopyPublicDownloadUrlTip: {
    rejected: 'Cannot get public download URL.',
    pending: 'Loading public download URL...',
    empty: 'Public download URL is not available.',
  },
});
