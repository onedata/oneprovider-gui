import FilesystemBrowserModel from './filesystem-browser-model';
import _ from 'lodash';

export default _.merge({}, FilesystemBrowserModel, {
  checkingSymlinkInArchive: 'checking symbolic link',
});
