/**
 * Standalone component for viewing and editing archive properties using archive settings
 * editor.
 *
 * @module components/archive-properties-modal
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { computed } from '@ember/object';
import { guidFor } from '@ember/object/internals';

export default Component.extend(I18n, {
  tagName: '',

  i18n: service(),
  archiveManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archivePropertiesModal',

  /**
   * @virtual
   * @type {Boolean}
   */
  open: false,

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * An archive for which info will be displayed or modified.
   * @virtual
   * @type {Utils.BrowsableArchive}
   */
  browsableArchive: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  onHide: notImplementedIgnore,

  /**
   * @virtual optional
   * @type {ArchiveFormOptions}
   */
  options: undefined,

  modalId: computed(function modalId() {
    return `archive-properties-modal-${guidFor(this)}`;
  }),

  onShown() {
    if (this.get('options.focusDescription')) {
      const modalId = this.get('modalId');
      /** @type {HTMLElement} */
      const descriptionInput =
        document.querySelector(`#${modalId} .description-field .form-control`);
      if (descriptionInput) {
        descriptionInput.focus();
        descriptionInput.select();
      }
    }
  },

  actions: {
    hide() {
      this.get('onHide')();
    },
    onShown() {
      this.onShown();
    },
  },
});
