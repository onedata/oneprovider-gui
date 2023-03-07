/**
 * Modal for viewing and editing dataset settings for file/directory
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { tag } from 'ember-awesome-macros';
import { guidFor } from '@ember/object/internals';
import { computed } from '@ember/object';

export default Component.extend(I18n, {
  tagName: '',

  /**
   * @type {Models.Space}
   * @virtual
   */
  space: undefined,

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
   * @virtual optional
   * Callback when the modal is starting to hide
   * @type {Function}
   */
  onHide: notImplementedIgnore,

  /**
   * @virtual optional
   * @type {Function}
   */
  getDataUrl: notImplementedIgnore,

  /**
   * @virtual optional
   * @type {Function}
   */
  getDatasetsUrl: notImplementedIgnore,

  /**
   * @virtual optional
   * @type {Function}
   */
  onCloseAllModals: notImplementedIgnore,

  modalId: computed(function modalId() {
    return `${guidFor(this)}-items-select-browser-modal`;
  }),

  parentModalDialogSelector: tag `#${'modalId'} > .modal-dialog`,

  hide() {
    this.get('onHide')();
  },

  actions: {
    hide() {
      this.hide();
    },
  },
});
