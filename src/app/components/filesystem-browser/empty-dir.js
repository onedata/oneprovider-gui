// FIXME: jsdoc

import FbEmptyDir from 'oneprovider-gui/components/file-browser/fb-empty-dir';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { reads } from '@ember/object/computed';

export default FbEmptyDir.extend(I18n, {
  classNames: ['filesystem-empty-dir'],

  /**
   * @override
   */
  i18nPrefix: 'components.filesystemBrowser.emptyDir',

  /**
   * @type {ComputedProperty<Array<Models.File>>}
   */
  fileClipboardFiles: reads('browserModel.fileClipboardFiles'),

  /**
   * @type {ComputedProperty<String>}
   */
  fileClipboardMode: reads('browserModel.fileClipboardMode'),

  emptyDirUpload: modelProxyMethod('emptyDirUpload'),
  emptyDirNewDirectory: modelProxyMethod('emptyDirNewDirectory'),
  emptyDirPlaceSymlink: modelProxyMethod('emptyDirPlaceSymlink'),
  emptyDirPlaceHardlink: modelProxyMethod('emptyDirPlaceHardlink'),
  emptyDirPaste: modelProxyMethod('emptyDirPaste'),
});

function modelProxyMethod(methodName) {
  return function () {
    return this.get('browserModel')[methodName](...arguments);
  };
}
