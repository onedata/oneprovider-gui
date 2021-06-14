/**
 * Implementation of browser-model (logic and co-related data) of filesystem-browser
 * for selecting files.
 *
 * @module utils/selector-filesystem-browser-model
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import FilesystemBrowserModel from 'oneprovider-gui/utils/filesystem-browser-model';
import { computed } from '@ember/object';
import {
  actionContext,
} from 'oneprovider-gui/components/file-browser';
import { raw, conditional } from 'ember-awesome-macros';

export default FilesystemBrowserModel.extend({
  /**
   * @override
   */
  i18nPrefix: 'utils.selectorFilesystemBrowserModel',

  /**
   * @virtual
   * @type {(Object) => any}
   */
  onSubmitSingleItem: notImplementedIgnore,

  /**
   * @virtual
   */
  chooseCurrentDirEnabled: true,

  /**
   * @override
   */
  buttonNames: conditional(
    'chooseCurrentDirEnabled',
    raw([
      'btnRefresh',
      'btnChooseCurrentDir',
    ]),
    raw([
      'btnRefresh',
    ]),
  ),

  /**
   * @override
   */
  readonlyFilesystem: true,

  /**
   * @override
   */
  disableStatusBar: true,

  /**
   * @override
   */
  onOpenFile(item /*, options */ ) {
    this.get('onSubmitSingleItem')(item);
  },

  btnChooseCurrentDir: computed(function btnChooseCurrentDir() {
    return this.createFileAction({
      id: 'chooseCurrentDir',
      icon: 'checked',
      action: ([currentDir]) => {
        return this.get('onSubmitSingleItem')(currentDir);
      },
      showIn: [
        actionContext.currentDir,
        actionContext.currentDirPreview,
        actionContext.spaceRootDir,
        actionContext.spaceRootDirPreview,
      ],
    });
  }),
});
