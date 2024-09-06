/**
 * Modal containing the value of xattr that can be copied.
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/i18n';

/**
 * @typedef {Object} XattrModalOptions
 * @property {string} xattrValue
 * @property {string} xattrKey
 */

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  tagName: '',

  i18n: service(),
  modalManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.modals.xattrModal',

  /**
   * @virtual
   * @type {string}
   */
  modalId: undefined,

  /**
   * @virtual
   * @type {XattrModalOptions}
   */
  modalOptions: undefined,

  /**
   * @type {Array<Model.File>}
   */
  files: computed('modalOptions.file', function files() {
    return [this.modalOptions.file];
  }),

  /**
   * @type {string}
   */
  xattrValue: reads('modalOptions.xattrValue'),

  /**
   * @type {string}
   */
  xattrKey: reads('modalOptions.xattrKey'),

  close() {
    this.modalManager.hide(this.modalId);
  },

  actions: {
    onHide() {
      this.close();
    },
  },
});
