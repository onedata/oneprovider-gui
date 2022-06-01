/**
 * Implementation of table headers for filesystem-browser.
 *
 * @module components/filesystem-browser/table-head-row
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableHeadRow from 'oneprovider-gui/components/file-browser/fb-table-head-row';
import { reads } from '@ember/object/computed';
import WindowResizeHandler from 'onedata-gui-common/mixins/components/window-resize-handler';
import { observer } from '@ember/object';
import sleep from 'onedata-gui-common/utils/sleep';

const mixins = [
  WindowResizeHandler,
];

export default FbTableHeadRow.extend(...mixins, {
  classNames: ['filesystem-table-head-row'],

  /**
   * @override
   */
  i18nPrefix: 'components.filesystemBrowser.tableHeadRow',

  /**
   * @type {ComputedProperty<string>}
   */
  jumpControlValue: reads('browserModel.jumpControlValue'),

  //#region state

  /**
   * Value controlled by `autoSetHideJumpControl`.
   * @type {boolean}
   */
  isJumpControlHidden: false,

  //#endregion

  dirObserver: observer('browserModel.dir', async function dirObserver() {
    // let header display feature tags for new dir
    await sleep(0);
    this.autoSetHideJumpControl();
  }),

  init() {
    this._super(...arguments);
    // activate dir observer
    this.get('browserModel.dir');
  },

  /**
   * @override
   */
  didInsertElement() {
    this._super(...arguments);
    this.autoSetHideJumpControl();
  },

  /**
   * @override
   * @param {TransitionEvent|UIEvent} event
   */
  onWindowResize( /** event */ ) {
    this.autoSetHideJumpControl();
  },

  autoSetHideJumpControl() {
    /** @type {HTMLElement} */
    const element = this.get('element');
    const jumpControlContainer = element.querySelector('.table-header-jump-control');
    this.set('isJumpControlHidden', jumpControlContainer.clientWidth < 150);
  },

  actions: {
    changeJumpControlValue(value) {
      this.get('browserModel').changeJumpControlValue(value);
    },
  },
});
