/**
 * Directory error view specific for filesystem browser.
 *
 * Currently just overrides default view translations.
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbDirLoadError from 'oneprovider-gui/components/file-browser/fb-dir-load-error';
import layout from 'oneprovider-gui/templates/components/file-browser/fb-dir-load-error';

export default FbDirLoadError.extend({
  layout,

  /**
   * @override
   */
  i18nPrefix: 'components.filesystemBrowser.dirLoadError',
});
