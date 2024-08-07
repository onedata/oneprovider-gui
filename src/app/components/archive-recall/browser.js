/**
 * A container for browser for selecting parent location to recall an archive
 *
 * @author Jakub Liput
 * @copyright (C) 2022-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import defaultResolveParent from 'oneprovider-gui/utils/default-resolve-parent';
import InModalBrowserContainerBase from 'oneprovider-gui/mixins/in-modal-item-browser-container-base';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import SelectLocationFilesystemBrowserModel from 'oneprovider-gui/utils/select-location-filesystem-browser-model';
import ItemBrowserContainerBase from 'oneprovider-gui/mixins/item-browser-container-base';

const mixins = [
  ItemBrowserContainerBase,
  InModalBrowserContainerBase,
];

/**
 * @implements {FilesystemSelectBrowserExtensionModel}
 */
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
  currentBrowsableItemError: undefined,

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
   * @virtual optional
   */
  ignoreDeselectSelector: '',

  /**
   * @implements InModalBrowserContainerBase
   * @type {String}
   * @virtual
   */
  modalBodyId: undefined,

  /**
   * If set to true - disable some functions of file browser to prevent user interaction.
   * @virtual optional
   * @type {Boolean}
   */
  disabled: false,

  /**
   * Called when browser performs some action that should change filesystem, because
   * it could change target file/dir validation status.
   * @virtual
   * @type {() => void}
   */
  onFilesystemChange: notImplementedIgnore,

  onDirIdChange: notImplementedThrow,

  onSelectedItemsChange: notImplementedThrow,

  /**
   * @implements {FilesystemSelectBrowserExtensionModel}
   */
  createItemParentDir: null,

  /**
   * @implements {FilesystemSelectBrowserExtensionModel}
   */
  fileToRename: null,

  browserModel: computed(function browserModel() {
    return ArchiveRecallBrowserModel.create({
      archiveRecallBrowser: this,
      ownerSource: this,
      openCreateNewDirectory: this.openCreateNewDirectory.bind(this),
      openRename: this.openRenameModal.bind(this),
      onRefresh: () => this.onFilesystemChange(),
    });
  }),

  /**
   * @override
   */
  willDestroyElement() {
    try {
      this.browserModel?.destroy();
    } finally {
      this._super(...arguments);
    }
  },

  openCreateNewDirectory(parentDir) {
    this.set('createItemParentDir', parentDir);
  },
  closeCreateItemModal( /* isCreated, file */ ) {
    // TODO: VFS-8215 jump to newly created directory
    this.set('createItemParentDir', null);
    this.get('onFilesystemChange')();
  },
  openRenameModal(file) {
    this.set('fileToRename', file);
  },
  closeRenameModal() {
    this.set('fileToRename', null);
    this.get('onFilesystemChange')();
  },

  updateDirEntityId(dirId) {
    this.get('onDirIdChange')(dirId);
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

  actions: {
    changeDirId() {
      const {
        disabled,
        onDirIdChange,
      } = this.getProperties(
        'disabled',
        'onDirIdChange',
      );
      if (!disabled && onDirIdChange) {
        onDirIdChange(...arguments);
      }
    },
  },
});

const ArchiveRecallBrowserModel = SelectLocationFilesystemBrowserModel.extend({
  dirProxy: reads('archiveRecallBrowser.currentBrowsableItemProxy'),
  changeSelectedItems() {
    if (!this.archiveRecallBrowser.disabled) {
      this.archiveRecallBrowser.onSelectedItemsChange(...arguments);
      this._super(...arguments);
    }
  },
});
