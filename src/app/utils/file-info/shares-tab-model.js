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
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { conditional, raw } from 'ember-awesome-macros';
import { getShareIdFromFileId } from 'onedata-gui-common/utils/file-id-parsers';

const mixins = [
  OwnerInjector,
  I18n,
];

export default BaseTabModel.extend(...mixins, {
  i18n: service(),

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
   * @virtual
   * @type {boolean}
   */
  readonly: undefined,

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
    const isSupportedFileType = file.type === 'file' || file.type === 'dir';
    const isInShare = Boolean(getShareIdFromFileId(get(file, 'entityId')));
    return isSupportedFileType && !isInShare;
  }),

  /**
   * @override
   */
  title: computed('file.name', 'sharesCount', function title() {
    let text = this.t('title');
    if (this.sharesCount) {
      text += ` (${this.sharesCount})`;
    }
    return text;
  }),

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
