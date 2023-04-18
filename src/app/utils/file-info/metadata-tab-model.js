/**
 * Tab model for showing file-metadata in file-info-modal
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseTabModel from './base-tab-model';
import { conditional, raw } from 'ember-awesome-macros';
import { computed, get } from '@ember/object';
import { reads, equal } from '@ember/object/computed';
import FileMetadataViewModel from 'oneprovider-gui/utils/file-metadata-view-model';
import computedT from 'onedata-gui-common/utils/computed-t';

export default BaseTabModel.extend({
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
    'hasMetadata',
    raw('checkbox-filled'),
    raw(undefined),
  ),

  /**
   * @override
   */
  tabClass: conditional(
    'hasMetadata',
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
  hasMetadata: reads('file.hasMetadata'),

  /**
   * @override
   */
  checkClose() {
    return this.viewModel.checkCurrentTabClose();
  },
});
