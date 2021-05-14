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
import { computed } from '@ember/object';

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
   */
  dataset: undefined,

  navigateOnezoneTarget: '_top',

  /**
   * @type {ComputedProperty<String>}
   */
  fileHref: computed('getDataUrl', 'dataset.rootFile', function fileHref() {
    const {
      getDataUrl,
      dataset,
    } = this.getProperties('getDataUrl', 'dataset');
    const fileId = dataset.relationEntityId('rootFile');
    if (fileId) {
      return getDataUrl({ fileId: null, selected: [fileId] });
    }
  }),
});
