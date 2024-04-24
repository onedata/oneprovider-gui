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
import { observer, computed } from '@ember/object';
import { scheduleOnce } from '@ember/runloop';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { or } from 'ember-awesome-macros';
import globals from 'onedata-gui-common/utils/globals';
import { inject as service } from '@ember/service';

const mixins = [
  WindowResizeHandler,
];

export default FbTableHeadFirstCell.extend(...mixins, {
  attributeBindings: ['colspan'],

  media: service(),

  /**
   * @type {number}
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

  dirObserver: observer('browserModel.dir', async function dirObserver() {
    // let header display feature tags for new dir
    scheduleOnce('afterRender', this, () => {
      globals.window.requestAnimationFrame(() => {
        safeExec(this, 'autoSetHideJumpControl');
      });
    });
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
