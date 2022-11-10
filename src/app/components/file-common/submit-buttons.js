/**
 * Pair of discard/save buttons often used in file aspects views.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  classNames: ['file-common-submit-buttons'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileCommon.submitButtons',

  /**
   * @virtual
   * @type {() => Promise}
   */
  onSave: undefined,

  /**
   * @virtual
   * @type {() => Promise}
   */
  onDiscard: undefined,

  /**
   * @virtual optional
   * @type {boolean}
   */
  isDiscardDisabled: false,

  /**
   * @virtual optional
   * @type {boolean}
   */
  isSaveDisabled: false,

  /**
   * @virtual optional
   * @type {string|SafeString}
   */
  saveTip: '',

  actions: {
    async save() {
      return this.onSave();
    },
    discard() {
      return this.onDiscard();
    },
  },
});
