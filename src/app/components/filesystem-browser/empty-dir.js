// FIXME: jsdoc

import FbDirLoadError from 'oneprovider-gui/components/file-browser/fb-dir-load-error';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default FbDirLoadError.extend(I18n, {
  classNames: ['filesystem-empty-dir'],

  /**
   * @override
   */
  i18nPrefix: 'components.filesystemBrowser.emptyDir',
});
