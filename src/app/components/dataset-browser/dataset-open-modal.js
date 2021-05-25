/**
 * Modal that shows actions on "leaf" dataset on file.
 *
 * @module components/dataset-browser
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';

export default Component.extend(I18n, {
  tagName: '',

  /**
   * @override
   */
  i18nPrefix: 'components.datasetBrowser.datasetOpenModal',

  /**
   * @virtual
   * @type {Function}
   */
  onHide: notImplementedIgnore,

  /**
   * @virtual
   * @type {Function}
   */
  onOpenArchivesView: notImplementedThrow,

  /**
   * @virtual
   */
  dataset: undefined,

  actions: {
    openArchivesView() {
      const {
        onOpenArchivesView,
        onHide,
        dataset,
      } = this.getProperties('onOpenArchivesView', 'onHide', 'dataset');
      onOpenArchivesView(dataset);
      onHide();
    },
  },
});
