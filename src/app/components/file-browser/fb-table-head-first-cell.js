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
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  tagName: 'th',
  classNames: ['draggable-area'],
  classNameBindings: [
    'browserModel.firstColumnClass',
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
   * @virtual
   * @type {(index: number, event: Object) => void}
   */
  onHeadingDrop: notImplementedIgnore,

  /**
   * @virtual
   * @type {(isOverBeforeArea: boolean, event: Object) => void }
   */
  onHeadingDragOver: notImplementedIgnore,

  /**
   * @virtual
   * @type {(event: Object) => void }
   */
  onHeadingDragLeave: notImplementedIgnore,

  /**
   * @type {boolean}
   */
  isDropBorderShown: false,

  actions: {
    headingDragOver(event) {
      this.onHeadingDragOver(false, event);
    },

    headingDragLeave(event) {
      this.onHeadingDragLeave(event);
    },

    headingDrop(event) {
      this.onHeadingDrop(0, event);
    },
  },
});
