/**
 * Modal for viewing and editing dataset settings for file/directory
 * 
 * @module components/datasets-modal
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: '',

  /**
   * @virtual optional
   * @type {Boolean}
   */
  editPrivilege: true,

  /**
   * One of: file, dataset.
   * - file: suitable for filesystem-browser, allow to toggle attachment state
   * - dataset: suitable for dataset-browser, no attachment toggle
   * @virtual optional
   * @type {String}
   */
  mode: 'file',

  /**
   * @virtual
   * Callback when the modal is starting to hide
   * @type {Function}
   */
  onHide: notImplementedIgnore,

  /**
   * @virtual
   * @type {Function}
   */
  getDataUrl: notImplementedIgnore,

  actions: {
    onHide() {
      this.get('onHide')();
    },
  },
});
