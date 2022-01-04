/**
 * Standalone component for creating archive using archive recall view
 *
 * @module components/archive-recall-modal
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { guidFor } from '@ember/object/internals';
import { computed } from '@ember/object';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';

// FIXME: options object
/**
 * @typedef {Object} RecallArchiveOptions
 */

export default Component.extend({
  tagName: '',

  /**
   * @virtual
   * @type {Boolean}
   */
  open: false,

  /**
   * An achive to be recalled.
   * @virtual
   * @type {Models.Dataset}
   */
  dataset: undefined,

  /**
   * Injected options for archive recall.
   * @virtual optional
   * @type {RecallArchiveOptions}
   */
  options: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  onHide: notImplementedIgnore,

  /**
   * Called when recall has been successfully started.
   * @virtual
   * @type {Function}
   */
  onArchiveRecallStarted: notImplementedReject,

  modalId: computed(function modalId() {
    return `${guidFor(this)}-archive-recall-modal`;
  }),

  actions: {
    hide() {
      this.get('onHide')();
    },
    async recallStarted(result) {
      const {
        onArchiveRecallStarted,
        onHide,
      } = this.getProperties(
        'onArchiveRecallStarted',
        'onHide',
      );
      if (onArchiveRecallStarted) {
        await onArchiveRecallStarted(result);
      }
      onHide();
    },
  },
});
