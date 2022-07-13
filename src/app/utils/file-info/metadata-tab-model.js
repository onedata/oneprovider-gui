import BaseTabModel from './base-tab-model';

export default BaseTabModel.extend({
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
  bodyComponent: 'file-metadata/body',
});
