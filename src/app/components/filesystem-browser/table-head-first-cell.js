/**
 * Implementation of first cell in table for filesystem-browser.
 *
 * @author Agnieszka Warchoł
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableHeadFirstCell from 'oneprovider-gui/components/file-browser/fb-table-head-first-cell';
import { reads } from '@ember/object/computed';
import WindowResizeHandler from 'onedata-gui-common/mixins/components/window-resize-handler';
import { computed } from '@ember/object';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { or } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { asyncObserver } from 'onedata-gui-common/utils/observer';
import waitForRender from 'onedata-gui-common/utils/wait-for-render';

const mixins = [
  WindowResizeHandler,
];

export default FbTableHeadFirstCell.extend(...mixins, {
  attributeBindings: ['colspan'],

  media: service(),

  /**
   * @type {ComputedProperty<number>}
   */
  colspan: computed('media.isMobile', function colspan() {
    return this.media.isMobile ? 2 : 1;
  }),

  /**
   * @type {ComputedProperty<string>}
   */
  jumpControlValue: reads('browserModel.jumpControlValue'),

  /**
   * Value controlled by `autoSetHideJumpControl`.
   * @type {boolean}
   */
  noSpaceForJumpControl: false,

  isShareRoot: reads('browserModel.dir.isShareRoot'),

  effIsJumpControlHidden: or('isShareRoot', 'noSpaceForJumpControl'),

  dirObserver: asyncObserver('browserModel.dir', async function dirObserver() {
    // let header display feature tags for new dir
    await waitForRender();
    safeExec(this, 'autoSetHideJumpControl');
  }),

  init() {
    this._super(...arguments);
    // activate dir observer
    this.get('browserModel.dir');
    this.dirObserver();
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
