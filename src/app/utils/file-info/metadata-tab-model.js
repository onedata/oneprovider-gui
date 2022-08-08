/**
 * Tab model for showing file-metadata in file-info-modal
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseTabModel from './base-tab-model';
import { conditional, raw } from 'ember-awesome-macros';
import { computed } from '@ember/object';
import FileMetadataViewModel from 'oneprovider-gui/utils/file-metadata-view-model';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import computedT from 'onedata-gui-common/utils/computed-t';
import { inject as service } from '@ember/service';

/**
 * @typedef {Object} MetadataViewModelCreateData
 * @property {boolean} previewMode
 */

const mixins = [
  OwnerInjector,
  I18n,
];

export default BaseTabModel.extend(...mixins, {
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.fileInfo.metadataTabModel',

  /**
   * Data needed to lazily instantiate ViewModel.
   * @virtual
   * @type {MetadataViewModelCreateData}
   */
  viewModelCreateData: undefined,

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
   * @type {Utils.FileMetadataViewModel}
   */
  viewModel: computed('file', function viewModel() {
    return FileMetadataViewModel.create({
      ownerSource: this,
      file: this.file,
      ...this.viewModelCreateData,
    });
  }),

  /**
   * @override
   */
  tryClose() {
    return this.viewModel.tryCloseCurrentTypeTab();
  },
});
