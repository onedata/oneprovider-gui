/**
 * Implementation of settings, logic and state for selectors browsing filesystem tree.
 *
 * @module utils/items-select-browser/filesystem-model
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseModel from './base-model';
import { computed, get, observer } from '@ember/object';
import SelectorFilesystemBrowserModel from 'oneprovider-gui/utils/selector-filesystem-browser-model';
import { promise, isEmpty, conditional, raw, array } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import joinStrings from 'onedata-gui-common/utils/i18n/join-strings';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import _ from 'lodash';

export default BaseModel.extend(I18n, {
  // FIXME: upload manager target space should be reverted after closing selector
  fileManager: service(),
  i18n: service(),
  uploadManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.itemsSelectBrowser.filesystemModel',

  /**
   * @override
   */
  browserExtensionComponentName: 'filesystem-select-browser',

  /**
   * @override
   */
  browserModel: computed('allowedFileTypes', function browserModel() {
    const {
      onSubmitSingleItem,
      dirIsAllowed,
    } = this.getProperties('onSubmitSingleItem', 'dirIsAllowed');
    return SelectorFilesystemBrowserModel.create({
      ownerSource: this,
      onSubmitSingleItem,
      chooseCurrentDirEnabled: dirIsAllowed,
    });
  }),

  /**
   * @override
   */
  dirProxy: promise.object(computed('space.rootDir', 'dirId', function dirProxy() {
    const {
      space,
      dirId,
    } = this.getProperties('space', 'dirId');
    if (dirId) {
      return this.get('fileManager').getFileById(dirId);
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

  spaceObserver: observer('space', function spaceObserver() {
    const {
      uploadManager,
      space,
    } = this.getProperties('uploadManager', 'space');
    uploadManager.changeTargetSpace(space);
  }),

  init() {
    this._super(...arguments);
    this.spaceObserver();
  },

  /**
   * @override
   */
  async fetchChildren(dirId, startIndex, size, offset) {
    const fileManager = this.get('fileManager');
    return fileManager
      .fetchDirChildren(dirId, 'private', startIndex, size, offset);
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
});
