/**
 * Implementation of empty-dir message for filesystem browser.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbEmptyDir from 'oneprovider-gui/components/file-browser/fb-empty-dir';
import I18n from 'onedata-gui-common/mixins/i18n';
import { reads } from '@ember/object/computed';
import { or } from 'ember-awesome-macros';

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

  /**
   * @type {ComputedProperty<Boolean>}
   */
  readonly: or('browserModel.readonlyFilesystem', 'previewMode'),

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
