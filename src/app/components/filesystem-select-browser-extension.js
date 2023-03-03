/**
 * Provides additional components used by filesystem browser used as selector-like
 * (eg. action modals, see what is in template).
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import { or, raw } from 'ember-awesome-macros';

/**
 * @typedef {Object} FilesystemSelectBrowserExtensionModel
 * @property {Models.File} createItemParentDir parent of newly created item in create item
 *   modal
 * @property {'dir'} [createItemType] a fileType of file to create using modal,
 *   currently only 'dir' is supported
 * @property {Models.File} fileToRename a file injected to rename modal
 * @method closeCreateItemModal
 */

export default Component.extend({
  /**
   * @virtual
   * @type {Utils.FilesystemBrowserModel}
   */
  browserModel: undefined,

  /**
   * @virtual
   * @type {Utils.ItemsSelectBrowser.FilesystemModel}
   */
  selectorModel: undefined,

  //#region state

  dir: reads('browserModel.dir'),

  createItemParentDir: reads('selectorModel.createItemParentDir'),
  createItemType: or('selectorModel.createItemType', raw('dir')),
  fileToRename: reads('selectorModel.fileToRename'),

  //#endregion

  //#region controller

  closeCreateItemModal(...args) {
    return this.get('selectorModel').closeCreateItemModal(...args);
  },

  closeRenameModal(...args) {
    return this.get('selectorModel').closeRenameModal(...args);
  },

  //#endregion
});
