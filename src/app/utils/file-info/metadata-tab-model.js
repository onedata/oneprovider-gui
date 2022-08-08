import BaseTabModel from './base-tab-model';
import { conditional, raw } from 'ember-awesome-macros';
import { computed } from '@ember/object';
import FileMetadataViewModel from 'oneprovider-gui/utils/file-metadata-view-model';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';

/**
 * @typedef {Object} MetadataViewModelCreateData
 * @property {boolean} previewMode
 */

const mixins = [
  OwnerInjector,
];

export default BaseTabModel.extend(...mixins, {
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
  // FIXME: i18n
  title: 'Metadata',

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
