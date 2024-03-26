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
import { observer, computed } from '@ember/object';
import { scheduleOnce } from '@ember/runloop';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { or, promise } from 'ember-awesome-macros';
import globals from 'onedata-gui-common/utils/globals';
import { inject as service } from '@ember/service';

const mixins = [
  WindowResizeHandler,
];

export default FbTableHeadRow.extend(...mixins, {
  classNames: ['filesystem-table-head-row'],

  providerManager: service(),

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

  /**
   * @type {PromiseObject<Models.Provider>}
   */
  currentProviderProxy: promise.object(computed(function currentProviderProxy() {
    return this.get('providerManager').getCurrentProvider();
  })),

  /**
   * @type {ComputedProperty<String>}
   */
  currentProviderName: reads('currentProviderProxy.content.name'),

  /**
   * @type {Array<String>}
   */
  columnsNamesWithTooltip: Object.freeze(
    ['qos', 'replication', 'modification', 'atime', 'ctime']
  ),

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
    headingDragAction(columnName, event) {
      if (!this.browserModel.readonlyFilesystem) {
        this.browserModel.disableUploadArea();
      }
      event.dataTransfer.setData('text', columnName);

      this.set('isDropBorderShown', true);
    },
    headingDragEndAction() {
      if (!this.browserModel.readonlyFilesystem) {
        this.browserModel.enableUploadArea();
      }
      this.set('isDropBorderShown', false);
    },
  },
});
