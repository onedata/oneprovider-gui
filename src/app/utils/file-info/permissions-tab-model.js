/**
 * Tab model for showing file-permissions in file-info-modal
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseTabModel from './base-tab-model';
import { computed, get } from '@ember/object';
import FilePermissionsViewModel from 'oneprovider-gui/utils/file-permissions-view-model';
import { conditional, raw } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import FileConsumerMixin, { computedMultiUsedFileGris } from 'oneprovider-gui/mixins/file-consumer';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';

const mixins = [
  FileConsumerMixin,
];

export default BaseTabModel.extend(...mixins, {
  /**
   * @override
   */
  i18nPrefix: 'utils.fileInfo.permissionsTabModel',

  /**
   * @virtual
   * @type {Array<Models.File>}
   */
  files: undefined,

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {boolean}
   */
  readonly: undefined,

  /**
   * @override
   */
  tabId: 'permissions',

  /**
   * @override
   */
  isSupportingMultiFiles: true,

  /**
   * @override
   */
  headerComponent: 'file-permissions/header',

  /**
   * @override
   */
  bodyComponent: 'file-permissions/body',

  /**
   * @override
   */
  footerComponent: conditional(
    'viewModel.effectiveReadonly',
    raw(''),
    raw('file-permissions/footer'),
  ),

  /**
   * @override
   */
  isVisible: computed(function isVisible() {
    if (!this._super(...arguments)) {
      return false;
    }
    const isSupportedFileType = this.files.every(file =>
      get(file, 'type') === 'file' || get(file, 'type') === 'dir'
    );
    return isSupportedFileType;
  }),

  /**
   * @override
   */
  modalClass: 'with-sticky-footer',

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  fileRequirements: computed('files', function fileRequirements() {
    if (!this.files) {
      return [];
    }
    return this.files.map(file =>
      new FileRequirement({
        fileGri: get(file, 'id'),
        properties: ['activePermissionsType'],
      }),
    );
  }),

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  usedFileGris: computedMultiUsedFileGris('files'),

  statusTag: conditional(
    'isAnyFileWithAcl',
    computedT('acl'),
    raw(null),
  ),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isAnyFileWithAcl: computed(
    'files.@each.activePermissionsType',
    function isAnyFileWithAcl() {
      return this.files?.some(file =>
        file && get(file, 'activePermissionsType') === 'acl'
      );
    }
  ),

  /**
   * @type {ComputedProperty<Utils.FilePermissionsViewModel>}
   */
  viewModel: computed('files.[]', 'space', 'readonly', function viewModel() {
    return FilePermissionsViewModel.create({
      ownerSource: this,
      files: this.files,
      space: this.space,
      readonly: this.readonly,
    });
  }),

  /**
   * @override
   */
  destroy() {
    try {
      this.cacheFor('viewModel')?.destroy();
    } finally {
      this._super(...arguments);
    }
  },

  /**
   * @override
   */
  checkClose() {
    return this.viewModel.checkClose();
  },
});
