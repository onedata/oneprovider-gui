import { FileType } from 'onedata-gui-common/utils/file';
import { ShareFileErrorType } from 'oneprovider-gui/utils/share-root-error-info';

export default {
  fileType: {
    [FileType.Regular]: 'file',
    [FileType.Directory]: 'directory',
    item: 'item',
  },
  rootFileTip: {
    [ShareFileErrorType.NotFound]: 'This share points to a deleted {{fileType}}',
    [ShareFileErrorType.NoAccess]: 'You don\'t have access to the space path where the shared data resides',
    [ShareFileErrorType.OtherError]: 'Cannot resolve the space path where the shared data resides',
  },
};
