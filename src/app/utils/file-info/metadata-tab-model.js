/**
 * Tab model for showing file-metadata in file-info-modal
 *
 * @author Jakub Liput
 * @copyright (C) 2022-2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseTabModel from './base-tab-model';
import { conditional, raw } from 'ember-awesome-macros';
import { computed, get } from '@ember/object';
import { reads, equal } from '@ember/object/computed';
import FileMetadataViewModel from 'oneprovider-gui/utils/file-metadata-view-model';
import computedT from 'onedata-gui-common/utils/computed-t';
import FileConsumerMixin, { computedSingleUsedFileGri } from 'oneprovider-gui/mixins/file-consumer';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';

const mixins = [
  FileConsumerMixin,
];

export default BaseTabModel.extend(...mixins, {
  /**
   * @override
   */
  i18nPrefix: 'utils.fileInfo.metadataTabModel',

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {boolean}
   */
  previewMode: undefined,

  /**
   * @override
   */
  tabId: 'metadata',

  /**
   * @override
   */
  title: computedT('title'),

  /**
   * @override
   */
  headerComponent: 'file-metadata/header',

  /**
   * @override
   */
  bodyComponent: 'file-metadata/body',

  /**
   * @override
   */
  footerComponent: conditional(
    'viewModel.effectiveReadonly',
    raw(''),
    raw('file-metadata/footer'),
  ),

  /**
   * @override
   */
  statusIcon: conditional(
    'hasCustomMetadata',
    raw('checkbox-filled'),
    raw(undefined),
  ),

  /**
   * @override
   */
  tabClass: conditional(
    'hasCustomMetadata',
    raw('tab-status-success'),
    raw(undefined),
  ),

  /**
   * Only xattrs have auto-hiding footer - other tabs has always footer shown.
   * @override
   */
  modalClass: conditional(
    'footerComponent',
    conditional(
      equal('viewModel.activeTab', 'xattrs'),
      raw('with-sticky-footer'),
      raw('')
    ),
    raw('without-footer'),
  ),

  /**
   * @override
   */
  isVisible: computed(function isVisible() {
    if (!this._super(...arguments)) {
      return false;
    }
    return get(this.file, 'type') === 'file' || get(this.file, 'type') === 'dir';
  }),

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  usedFileGris: computedSingleUsedFileGri('file'),

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  fileRequirements: computed('file', function fileRequirements() {
    if (!this.file) {
      return [];
    }
    return [
      new FileRequirement({
        fileGri: this.get('file.id'),
        properties: ['hasCustomMetadata'],
      }),
    ];
  }),

  /**
   * @type {ComputedProperty<Utils.FileMetadataViewModel>}
   */
  viewModel: computed('file', 'space', 'previewMode', function viewModel() {
    return FileMetadataViewModel.create({
      ownerSource: this,
      file: this.file,
      space: this.space,
      previewMode: this.previewMode,
    });
  }),

  /**
   * @type {ComputedProperty<boolean>}
   */
  hasCustomMetadata: reads('file.hasCustomMetadata'),

  /**
   * @override
   */
  willDestroy() {
    try {
      this.viewModel?.destroy();
    } finally {
      this._super(...arguments);
    }
  },

  /**
   * @override
   */
  checkClose() {
    return this.viewModel.checkCurrentTabClose();
  },
});
