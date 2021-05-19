/**
 * View for dir-based dataset that have no children.
 *
 * @module components/dataset-browser/empty-dir
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbDirLoadError from 'oneprovider-gui/components/file-browser/fb-dir-load-error';
import I18n from 'onedata-gui-common/mixins/components/i18n';
export default FbDirLoadError.extend(I18n, {
  classNames: ['archive-empty-dir'],

  /**
   * @override
   */
  i18nPrefix: 'components.archiveBrowser.emptyDir',
});
