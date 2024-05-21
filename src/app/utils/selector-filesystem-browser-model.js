/**
 * Implementation of browser-model (logic and co-related data) of filesystem-browser
 * for selecting files.
 *
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
import { raw, conditional, array } from 'ember-awesome-macros';

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
   * Set to true to show `chooseCurrentDir` action button in current dir context menu.
   * @virtual
   */
  chooseCurrentDirEnabled: true,

  /**
   * @override
   */
  buttonNames: array.concat(
    raw([
      'btnInfo',
      'btnUpload',
      'btnNewDirectory',
      'btnRefresh',
      'btnRename',
    ]),
    conditional(
      'chooseCurrentDirEnabled',
      raw(['btnChooseCurrentDir']),
      raw([])
    )
  ),

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
    return this.createItemBrowserAction({
      id: 'chooseCurrentDir',
      icon: 'checked',
      action: ([currentDir]) => {
        return this.get('onSubmitSingleItem')(currentDir);
      },
      showIn: [
        actionContext.currentDir,
        actionContext.currentDirPreview,
        actionContext.rootDir,
        actionContext.rootDirPreview,
      ],
    });
  }),
});
