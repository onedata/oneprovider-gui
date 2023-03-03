/**
 * A modal that renders `items-select-browser`.
 * See `components/dummy-items-select-browser` for usage examples.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { guidFor } from '@ember/object/internals';
import { computed } from '@ember/object';
import { tag } from 'ember-awesome-macros';

export default Component.extend({
  tagName: '',

  /**
   * @virtual
   * @type {Boolean}
   */
  open: false,

  /**
   * @virtual
   */
  selectorModel: undefined,

  /**
   * @virtual
   * @type {(selectedItems: Array) => any}
   */
  onSubmit: notImplementedThrow,

  /**
   * @virtual
   * @type {() => any}
   */
  onCancel: notImplementedIgnore,

  /**
   * @virtual
   * @type {() => any}
   */
  onHide: notImplementedIgnore,

  modalId: computed(function modalId() {
    return `${guidFor(this)}-items-select-browser-modal`;
  }),

  parentModalDialogSelector: tag `#${'modalId'} > .modal-dialog`,

  actions: {
    submit(selectedItems) {
      const {
        onSubmit,
        onHide,
        selectorModel,
      } = this.getProperties('onSubmit', 'onHide', 'selectorModel');
      onSubmit(selectedItems);
      onHide();
      selectorModel.resetState();
    },
    cancel() {
      const {
        onCancel,
        onHide,
        selectorModel,
      } = this.getProperties('onCancel', 'onHide', 'selectorModel');
      onCancel();
      onHide();
      selectorModel.resetState();
    },
  },
});
