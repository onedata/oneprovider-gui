/**
 * Implementation of settings, logic and state for selectors browsing filesystem tree.
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseModel from './base-model';
import { computed, get, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import SelectorFilesystemBrowserModel from 'oneprovider-gui/utils/selector-filesystem-browser-model';
import { promise, isEmpty, conditional, raw, array } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import joinStrings from 'onedata-gui-common/utils/i18n/join-strings';
import I18n from 'onedata-gui-common/mixins/i18n';
import _ from 'lodash';
import InfoModalBrowserSupport from 'oneprovider-gui/mixins/info-modal-browser-support';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { all as allFulfilled } from 'rsvp';

const mixins = [
  I18n,
  InfoModalBrowserSupport,
];

/**
 * @implements {FilesystemSelectBrowserExtensionModel}
 */
export default BaseModel.extend(...mixins, {
  fileManager: service(),
  i18n: service(),
  uploadManager: service(),
  spaceManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.itemsSelectBrowser.filesystemModel',

  /**
   * @override
   */
  browserExtensionComponentName: 'filesystem-select-browser-extension',

  /**
   * @implements {FilesystemSelectBrowserExtensionModel}
   */
  createItemParentDir: null,

  /**
   * @implements {FilesystemSelectBrowserExtensionModel}
   */
  createItemType: null,

  /**
   * @implements {FilesystemSelectBrowserExtensionModel}
   */
  fileToRename: null,

  /**
   * @override
   */
  initialRequiredDataProxy: computed(
    'initialDirProxy',
    'dirStatsServiceStateProxy',
    function initialRequiredDataProxy() {
      return promiseObject(allFulfilled([
        this.initialDirProxy,
        this.dirStatsServiceStateProxy,
      ]));
    }
  ),

  /**
   * @override
   */
  browserModel: computed(function browserModel() {
    return SelectorFilesystemBrowserModel
      .extend({
        chooseCurrentDirEnabled: reads('itemsSelectBrowser.dirIsAllowed'),
        dirProxy: reads('itemsSelectBrowser.dirProxy'),
        changeSelectedItems() {
          this._super(...arguments);
          this.itemsSelectBrowser.setSelectedItems(...arguments);
        },
      })
      .create({
        ownerSource: this,
        itemsSelectBrowser: this,
        space: this.space,
        onSubmitSingleItem: this.submitSingleFilesystemItem.bind(this),
        openCreateNewDirectory: this.openCreateNewDirectory.bind(this),
        openRename: this.openRenameModal.bind(this),
        openInfo: this.openInfoModal.bind(this),
      });
  }),

  /**
   * @override
   */
  dirProxy: promise.object(computed('space.rootDir', 'dirId', function dirProxy() {
    const {
      fileManager,
      space,
      dirId,
    } = this.getProperties('fileManager', 'space', 'dirId');
    if (dirId) {
      return fileManager.getFileById(dirId);
    } else {
      return get(space, 'rootDir');
    }
  })),

  dirIsAllowed: array.includes('allowedFileTypes', raw('dir')),

  itemTypeText: computed(
    'allowedFileTypes',
    'maxItems',
    function itemTypeText() {
      const {
        i18n,
        allowedFileTypes,
        maxItems,
      } = this.getProperties(
        'i18n',
        'allowedFileTypes',
        'maxItems',
      );
      const countKey = (maxItems === 1) ? 'single' : 'multi';
      if (get(allowedFileTypes, 'length') === 1) {
        return this.t(`fileType.${countKey}.${allowedFileTypes[0]}`);
      } else {
        return joinStrings(
          i18n,
          allowedFileTypes.map(type => this.t(`fileType.${countKey}.${type}`)),
          'or'
        );
      }
    }
  ),

  allAllowedTypes: raw(['file', 'dir', 'symlink']),

  allowedFileTypes: conditional(
    isEmpty('constraintSpec.allowedFileTypes'),
    'allAllowedTypes',
    'constraintSpec.allowedFileTypes'
  ),

  allTypesAreAllowed: computed(
    'allAllowedTypes',
    'allowedFileTypes',
    function allTypesAreAllowed() {
      const {
        allAllowedTypes,
        allowedFileTypes,
      } = this.getProperties('allAllowedTypes', 'allowedFileTypes');
      return _.isEqual(allAllowedTypes, allowedFileTypes);
    }
  ),

  submitCurrentAvailable: computed(
    'submitCurrentLabel',
    'allowedFileTypes.[]',
    function submitCurrentAvailable() {
      const base = this._super(...arguments);
      if (base) {
        const allowedFileTypes = this.get('allowedFileTypes');
        return (allowedFileTypes || []).includes('dir');
      } else {
        return base;
      }
    }
  ),

  /**
   * @type {PromiseObject<DirStatsServiceState>}
   */
  dirStatsServiceStateProxy: computed(
    'space.entityId',
    function dirStatsServiceStateProxy() {
      return promiseObject(
        this.spaceManager.getDirStatsServiceState(get(this.space, 'entityId'))
      );
    }
  ),

  spaceObserver: observer('space', function spaceObserver() {
    const {
      uploadManager,
      space,
    } = this.getProperties('uploadManager', 'space');
    // TODO: VFS-7961 after modification of uploadManager global state, there should be revert
    // if using selector inside filesystem browser
    uploadManager.changeTargetSpace(space);
  }),

  init() {
    this._super(...arguments);
    this.spaceObserver();
  },

  /**
   * @override
   */
  willDestroy() {
    try {
      this.browserModel?.destroy?.();
    } finally {
      this._super(...arguments);
    }
  },

  /**
   * @override
   */
  getValidationError() {
    const baseValidation = this._super(...arguments);
    if (baseValidation) {
      return baseValidation;
    }
    const {
      i18n,
      allowedFileTypes,
      allTypesAreAllowed,
      selectorSelectedItems,
    } = this.getProperties(
      'i18n',
      'allowedFileTypes',
      'allTypesAreAllowed',
      'selectorSelectedItems'
    );
    if (allTypesAreAllowed) {
      return;
    }
    const selectedItemsTypes = selectorSelectedItems.mapBy('type');
    for (const type of selectedItemsTypes) {
      if (!allowedFileTypes.includes(type)) {
        return this.t('typeConstraint', {
          typesText: joinStrings(
            i18n,
            allowedFileTypes.map(type => this.t(`fileType.multi.${type}`)),
            'or'
          ),
        });
      }
    }
  },

  submitSingleFilesystemItem(filesystemItem) {
    const {
      allowedFileTypes,
      onSubmitSingleItem,
    } = this.getProperties('allowedFileTypes', 'onSubmitSingleItem');
    const type = get(filesystemItem, 'type');
    if (allowedFileTypes.includes(type)) {
      return onSubmitSingleItem(filesystemItem);
    }
  },

  openCreateNewDirectory(parentDir) {
    this.setProperties({
      createItemParentDir: parentDir,
      createItemType: 'dir',
    });
  },

  closeCreateItemModal(isCreated, file) {
    if (isCreated && file) {
      const {
        browserSelectedItems,
        allowedFileTypes,
      } = this.getProperties('browserSelectedItems', 'allowedFileTypes');
      if (
        (!browserSelectedItems || !browserSelectedItems.length) &&
        allowedFileTypes.includes(get(file, 'type'))
      ) {
        // TODO: VFS-8215 jump to newly created directory - something doesn't work
        this.get('browserModel.fbTableApi').forceSelectAndJump([file]);
      }
    }

    this.setProperties({
      createItemParentDir: null,
      createItemType: null,
    });
  },

  openRenameModal(file) {
    this.set('fileToRename', file);
  },

  closeRenameModal() {
    this.set('fileToRename', null);
  },

  /**
   * Dummy implementation needed for info modal mixin to not crash.
   * The selector has own implementation of this action in `ItemsSelectBrowser` component.
   */
  changeSelectedItems() {},
});
