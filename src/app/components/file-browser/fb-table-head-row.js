/**
 * Row of file browser table header (thead)
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import WindowResizeHandler from 'onedata-gui-common/mixins/components/window-resize-handler';

const mixins = [
  I18n,
  WindowResizeHandler,
];

export default Component.extend(...mixins, {
  tagName: 'tr',
  classNames: ['fb-table-head-row'],

  /**
   * @virtual
   * @type {Utils.BaseBrowserModel}
   */
  browserModel: undefined,

  init() {
    this._super(...arguments);
    this.browserModel.getEnabledColumnsFromLocalStorage();
    this.browserModel.checkColumnsVisibility();
  },

  /**
   * @param {TransitionEvent|UIEvent} event
   */
  onWindowResize( /** event */ ) {
    this.browserModel.checkColumnsVisibility();
  },
});
