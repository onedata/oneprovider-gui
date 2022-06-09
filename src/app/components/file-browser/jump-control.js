/**
 * Input box capable to jump to browser item using name prefix (eg. to file in file
 * browser).
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { get, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import { cancel, debounce, later } from '@ember/runloop';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';

export default Component.extend(I18n, {
  classNames: ['jump-control'],

  fileManager: service(),
  isMobile: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.jumpControl',

  /**
   * @virtual
   * @type {Utils.FilesystemBrowserModel}
   */
  browserModel: undefined,

  /**
   * @virtual
   * @type {(value: string) => void}
   */
  changeInputValue: undefined,

  /**
   * Debounced jump delay in milliseconds.
   * @type {number}
   */
  jumpScheduleDelay: 500,

  //#region state

  /**
   * @type {string}
   */
  inputValue: '',

  /**
   * @type {boolean}
   */
  isJumpInProgress: false,

  /**
   * Timeout ID for automatic jump performing after input change.
   * @type {any}
   */
  performJumpTimeoutId: null,

  /**
   * Timeout ID for hiding "prefix not found" tooltip.
   * @type {any}
   */
  showNotFoundTooltipTimeoutId: null,

  /**
   * Type of "not found" text in tooltip:
   * - next - item for prefix was not found, selected next item
   * - end - prefix "search" reached end of list - selected last list item
   * @type {'next'|'end'}
   */
  notFoundTipType: '',

  //#endregion

  parentScope: reads('browserModel.dir.scope'),

  /**
   * Entity ID of items container (directory, dataset directory, etc.)
   * to search the item by prefix in.
   * @type {string}
   */
  parentDirId: reads('browserModel.dir.entityId'),

  inputValueObserver: observer('inputValue', function inputValueObserver() {
    if (this.get('inputValue')) {
      this.scheduleJump();
    } else {
      this.hideNotFoundTooltip();
    }
  }),

  /**
   * @override
   */
  willDestroyElement() {
    this._super(...arguments);
    this.clearDebounce();
  },

  /**
   * @param {File} item
   * @returns {Promise}
   */
  tableSelectAndJump(item) {
    const tableApi = this.get('browserModel.fbTableApi');
    return tableApi.jump(item);
  },

  scheduleJump() {
    const jumpScheduleDelay = this.get('jumpScheduleDelay');
    const performJumpTimeoutId = debounce(this, 'performJump', jumpScheduleDelay);
    this.set('performJumpTimeoutId', performJumpTimeoutId);
  },

  async performJump() {
    const {
      fileManager,
      parentDirId,
      parentScope,
      inputValue,
    } = this.getProperties(
      'fileManager',
      'parentDirId',
      'parentScope',
      'inputValue',
    );
    if (!inputValue) {
      return;
    }
    try {
      this.set('isJumpInProgress', true);
      let fileData = await fileManager.getFileDataByName(
        parentDirId,
        inputValue, {
          scope: parentScope,
        }
      );
      let notFoundTipType;
      const isLastJumpFailed = !fileData || !fileData.name ||
        !fileData.name.startsWith(inputValue);
      if (isLastJumpFailed) {
        notFoundTipType = 'next';
        const fbTableApi = this.get('browserModel.fbTableApi');
        const filesArray = fbTableApi.getFilesArray();
        // when the file is loaded in current list, but in fact it is already deleted
        // on backend - we should refresh list to show current state
        const prefixIsOnCurrentList =
          filesArray.find(f => get(f, 'name').startsWith(inputValue));
        if (prefixIsOnCurrentList) {
          await fbTableApi.refresh();
        }
      }
      if (!fileData) {
        notFoundTipType = 'end';
        fileData = await fileManager.getFileDataByName(
          parentDirId,
          inputValue, {
            offset: -1,
            scope: parentScope,
          });
      }
      if (!fileData) {
        return;
      }
      const fileId = get(fileData, 'guid');
      const file = await fileManager.getFileById(fileId, parentScope);
      await this.tableSelectAndJump(file);
      if (isLastJumpFailed) {
        cancel(this.get('showNotFoundTooltipTimeoutId'));
        const showNotFoundTooltipTimeoutId = later(() => {
          this.hideNotFoundTooltip();
        }, 5000);
        const notFoundTip = this.t(`notFoundTip.${notFoundTipType}`);
        safeExec(this, 'setProperties', {
          showNotFoundTooltipTimeoutId,
          notFoundTip,
        });
      } else {
        this.hideNotFoundTooltip();
      }
    } finally {
      this.set('isJumpInProgress', false);
    }
  },

  clearDebounce() {
    const performJumpTimeoutId = this.get('performJumpTimeoutId');
    if (performJumpTimeoutId == null) {
      return;
    }
    cancel(performJumpTimeoutId);
    this.set('performJumpTimeoutId', null);
  },

  hideNotFoundTooltip() {
    cancel(this.get('showNotFoundTooltipTimeoutId'));
    // note, that notFoundTip is not cleared, because there is a fade-out animation
    this.set('showNotFoundTooltipTimeoutId', null);
  },

  actions: {
    async performJumpImmediately() {
      this.clearDebounce();
      return this.performJump();
    },
    changeValue(value) {
      this.get('changeInputValue')(value);
    },
    hideNotFoundTooltip() {
      this.hideNotFoundTooltip();
    },
  },
});
