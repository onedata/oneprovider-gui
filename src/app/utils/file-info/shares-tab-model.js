/**
 * Tab model for showing file-shares in file-info-modal
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseTabModel from './base-tab-model';
import { get, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import FileSharesViewModel from 'oneprovider-gui/utils/file-shares-view-model';
import { conditional, raw } from 'ember-awesome-macros';

export default BaseTabModel.extend({
  /**
   * @override
   */
  i18nPrefix: 'utils.fileInfo.sharesTabModel',

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
   * @override
   */
  tabId: 'shares',

  /**
   * @override
   */
  headerComponent: conditional(
    'sharesCount',
    raw('file-shares/header'),
    raw(''),
  ),

  /**
   * @override
   */
  bodyComponent: 'file-shares/body',

  /**
   * @override
   */
  footerComponent: conditional(
    'sharesCount',
    raw('file-shares/footer'),
    raw(''),
  ),

  /**
   * @override
   */
  isVisible: computed(function isVisible() {
    if (!this._super(...arguments)) {
      return false;
    }
    const file = this.file;
    const isSupportedFileType = get(file, 'type') === 'file' ||
      get(file, 'type') === 'dir';
    const isInShare = get(file, 'scope') === 'public';
    return isSupportedFileType && !isInShare;
  }),

  /**
   * @override
   */
  statusNumber: reads('sharesCount'),

  /**
   * @override
   */
  modalClass: conditional(
    'footerComponent',
    raw('with-sticky-footer'),
    raw('without-footer'),
  ),

  // FIXME: custom property use
  /**
   * @type {ComputedProperty<number>}
   */
  sharesCount: reads('file.sharesCount'),

  /**
   * @type {ComputedProperty<Utils.FilePermissionsViewModel>}
   */
  viewModel: computed('file', 'space', function viewModel() {
    return FileSharesViewModel.create({
      ownerSource: this,
      file: this.file,
      space: this.space,
    });
  }),
});
