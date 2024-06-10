import FilesystemBrowserModel from './filesystem-browser-model';
import _ from 'lodash';

export default _.merge({}, FilesystemBrowserModel, {
  checkingSymlinkInArchive: 'checking symbolic link',
  refreshNonLive: '<p>Up-to-date – the contents of a persisted archive never change and so automatic refresh is disabled. Nevertheless, some context information about the files may change (e.g. the number of hard links when an incremental archive is created).</p><p>Use this button to trigger a refresh at any time.</p>',
  refreshLiveColumns: '<p>Up-to-date – the list is automatically refreshed every {{pollingIntervalSecs}} seconds to show the latest context information about files, such as replication ratio. Nevertheless, the logical contents of a persisted archive never change.</p><p>Use this button to manually trigger a refresh.</p>',
});
