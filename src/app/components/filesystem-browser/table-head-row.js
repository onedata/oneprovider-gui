/**
 * Implementation of table headers for filesystem-browser.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableHeadRow from 'oneprovider-gui/components/file-browser/fb-table-head-row';
import { reads } from '@ember/object/computed';
import WindowResizeHandler from 'onedata-gui-common/mixins/components/window-resize-handler';
import { observer } from '@ember/object';
import { scheduleOnce } from '@ember/runloop';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { or } from 'ember-awesome-macros';
import { computed } from '@ember/object';

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
  noSpaceForJumpControl: false,

  //#endregion

  isShareRoot: reads('browserModel.dir.isShareRoot'),

  effIsJumpControlHidden: or('isShareRoot', 'noSpaceForJumpControl'),

  dirObserver: observer('browserModel.dir', async function dirObserver() {
    // let header display feature tags for new dir
    scheduleOnce('afterRender', this, () => {
      window.requestAnimationFrame(() => {
        safeExec(this, 'autoSetHideJumpControl');
      });
    });
  }),

  /**
   * @type {Object}
   */
  columnsStyle: computed('browserModel', function columnsStyle() {
    return this.browserModel.columnsStyle();
  }),

  init() {
    this._super(...arguments);
    // activate dir observer
    this.get('browserModel.dir');
    this.dirObserver();
    this.browserModel.getEnabledColumnsFromLocalStorage();
    this.browserModel.checkColumnsVisibility();
  },

  /**
   * @override
   * @param {TransitionEvent|UIEvent} event
   */
  onWindowResize( /** event */ ) {
    this.autoSetHideJumpControl();
    this.browserModel.checkColumnsVisibility();
  },

  autoSetHideJumpControl() {
    /** @type {HTMLElement} */
    const element = this.get('element');
    const jumpControlContainer = element.querySelector('.table-header-jump-control');
    if (!jumpControlContainer) {
      return;
    }
    this.set('noSpaceForJumpControl', jumpControlContainer.clientWidth < 150);
  },

  actions: {
    changeJumpControlValue(value) {
      this.get('browserModel').changeJumpControlValue(value);
    },
  },
});
