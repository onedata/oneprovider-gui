/**
 * A container for browser for selecing
 *
 * @module components/archive-recall/browser
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { inject as service } from '@ember/service';
import defaultResolveParent from 'oneprovider-gui/utils/default-resolve-parent';
import InModalBrowserContainerBase from 'oneprovider-gui/mixins/in-modal-item-browser-container-base';
import SelectLocationFilesystemBrowserModel from 'oneprovider-gui/utils/select-location-filesystem-browser-model';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';

const mixins = [
  InModalBrowserContainerBase,
];

export default Component.extend(...mixins, {
  classNames: ['archive-recall-browser', 'in-modal-item-browser-container'],

  i18n: service(),
  fileManager: service(),

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   */
  currentBrowsableItem: undefined,

  /**
   * @virtual
   */
  parentModalDialogSelector: '',

  /**
   * @virtual
   */
  selectedItems: undefined,

  /**
   * @virtual
   */
  browserRequiredDataProxy: undefined,

  /**
   * @implements InModalBrowserContainerBase
   * @type {String}
   * @virtual
   */
  modalBodyId: undefined,

  onDirIdChange: notImplementedThrow,

  onSelectedItemsChange: notImplementedThrow,

  browserModel: computed(function browserModel() {
    return SelectLocationFilesystemBrowserModel
      .create({
        ownerSource: this,
        openCreateNewDirectory: this.openCreateNewDirectory.bind(this),
        openRename: this.openRenameModal.bind(this),
      });
  }),

  createItemParentDir: null,

  createItemType: 'dir',

  // FIXME: methods copy-pasted experimentally, refactor

  openCreateNewDirectory(parentDir) {
    this.set('createItemParentDir', parentDir);
  },
  closeCreateItemModal( /* isCreated, file */ ) {
    // TODO: VFS-8215 jump to newly created directory
    this.set('createItemParentDir', null);
  },
  openRenameModal(file) {
    this.set('fileToRename', file);
  },
  closeRenameModal() {
    this.set('fileToRename', null);
  },

  updateDirEntityId(dirId) {
    this.get('onDirIdChange')(dirId);
  },
  changeSelectedItems(items) {
    return this.get('onSelectedItemsChange')(items);
  },
  async fetchChildren(dirId, startIndex, size, offset) {
    const fileManager = this.get('fileManager');
    return fileManager
      .fetchDirChildren(dirId, 'private', startIndex, size, offset);
  },
  resolveItemParent(item) {
    const selectorModel = this.get('selectorModel');
    const resolveItemParentFun = get(selectorModel, 'resolveItemParent');
    return resolveItemParentFun ?
      resolveItemParentFun.call(selectorModel, item) :
      defaultResolveParent(item);
  },
});
