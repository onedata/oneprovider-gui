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
   */
  constraintSpec: undefined,

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
      } = this.getProperties('onSubmit', 'onHide');
      onSubmit(selectedItems);
      onHide();
    },
    cancel() {
      const {
        onCancel,
        onHide,
      } = this.getProperties('onCancel', 'onHide');
      onCancel();
      onHide();
    },
  },
});
