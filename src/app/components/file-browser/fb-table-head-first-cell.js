/**
 * First cell (th) of file browser table header (thead).
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { reads } from '@ember/object/computed';

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  tagName: 'th',
  classNameBindings: [
    'browserModel.firstColumnClass',
    'isDropBorderShown:border-dashed',
  ],

  /**
   * @override
   */
  i18nPrefix: reads('browserModel.headRowTranslation'),

  /**
   * @virtual
   * @type {Utils.BaseBrowserModel}
   */
  browserModel: undefined,

  /**
   * @type {boolean}
   */
  isDropBorderShown: false,

  actions: {
    headingDragOverAction(event) {
      this.headingDragOverAction(event);
    },
    headingDragLeaveAction() {
      this.headingDragLeaveAction();
    },
    headingDropAction(index, event) {
      this.headingDropAction(index, event);
    },
  },
});
