/**
 * Provides additional components used by filesystem browser used as selector
 * (eg. action modals).
 * 
 * See `utils/items-select-browser/filesystem-model` for logic implementation.
 *
 * @module components/filesystem-select-browser-extension
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';

export default Component.extend({
  /**
   * @virtual
   * @type {Utils.ItemsSelectBrowser.FilesystemModel}
   */
  selectorModel: undefined,

  createItemParentDir: reads('selectorModel.createItemParentDir'),
  createItemType: reads('selectorModel.createItemType'),
  fileToRename: reads('selectorModel.fileToRename'),
  renameParentDir: reads('selectorModel.renameParentDir'),

  closeCreateItemModal(...args) {
    return this.get('selectorModel').closeCreateItemModal(...args);
  },

  closeRenameModal(...args) {
    return this.get('selectorModel').closeRenameModal(...args);
  },
});
