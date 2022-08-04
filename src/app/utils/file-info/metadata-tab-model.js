import BaseTabModel from './base-tab-model';
import { conditional, raw } from 'ember-awesome-macros';

export default BaseTabModel.extend({
  /**
   * @virtual
   * @type {Utils.FileMetadataViewModel}
   */
  viewModel: undefined,

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
});
